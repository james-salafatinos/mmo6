import { io } from 'https://cdn.socket.io/4.4.1/socket.io.esm.min.js';
import { getCurrentUser, logout } from '/client/js/auth/auth.js';
import { updateUserCountDisplay } from '/client/ui.js';
import { AUTH_EVENTS, SYSTEM_EVENTS } from '/shared/SocketEventDefinitions.js';

// Create socket instance
const socket = io();

// Track connection status
let isConnected = false;
let isAuthenticated = false;

// Connect to the server
socket.on(SYSTEM_EVENTS.CONNECT, () => {
    console.log('[/client/socket.js - connect] Connected to server');
    isConnected = true;
    
    // Authenticate with the server if we have a user
    authenticateSocket();
});

// Handle disconnection
socket.on(SYSTEM_EVENTS.DISCONNECT, () => {
    console.log('[/client/socket.js - disconnect] Disconnected from server');
    isConnected = false;
    isAuthenticated = false;
});

// Handle authentication success
socket.on(AUTH_EVENTS.AUTHENTICATED, (data) => {
    console.log('[/client/socket.js - authenticated] Socket authenticated successfully');
    isAuthenticated = true;
});

// Handle authentication error
socket.on(AUTH_EVENTS.AUTHENTICATION_ERROR, (data) => {
    console.error('[/client/socket.js - authentication_error] Socket authentication failed:', data.message);
    isAuthenticated = false;
});

// Handle user count updates
socket.on(SYSTEM_EVENTS.USER_COUNT_UPDATE, (data) => {
    console.log(`[/client/socket.js - user_count_update] Online users: ${data.count}`);
    updateUserCountDisplay(data.count);
});

// Handle duplicate session detection
socket.on(AUTH_EVENTS.DUPLICATE_SESSION, (data) => {
    console.warn('[/client/socket.js - duplicate_session] Duplicate session detected:', data.message);
    
    // Show alert to user
    alert(data.message);
    
    // Force logout and redirect to login page
    logout();
    window.location.href = '/login';
});

// Handle new login attempt notification
socket.on(AUTH_EVENTS.NEW_LOGIN_ATTEMPT, (data) => {
    console.warn('[/client/socket.js - new_login_attempt] New login attempt detected:', data.message);
    
    // Optionally show notification to user
    // This is the existing tab that will remain active
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = data.message;
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
});

// Function to authenticate the socket with current user
function authenticateSocket() {
    if (!isConnected) {
        console.warn('[/client/socket.js - authenticateSocket] Cannot authenticate: not connected');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        console.warn('[/client/socket.js - authenticateSocket] Cannot authenticate: no current user');
        return;
    }
    
    console.log('[/client/socket.js - authenticateSocket] Authenticating socket for user:', user.id);
    socket.emit(AUTH_EVENTS.AUTHENTICATE, {
        userId: user.id,
        sessionToken: user.sessionToken
    });
}

// Re-authenticate when user logs in
document.addEventListener('userLoggedIn', () => {
    console.log('[/client/socket.js - userLoggedIn] User logged in, authenticating socket');
    authenticateSocket();
});

// Handle logout
document.addEventListener('userLoggedOut', () => {
    console.log('[/client/socket.js - userLoggedOut] User logged out, notifying server');
    if (isConnected) {
        socket.emit(AUTH_EVENTS.LOGOUT);
    }
    isAuthenticated = false;
});



// Export socket instance and authentication function
export { socket, authenticateSocket };
