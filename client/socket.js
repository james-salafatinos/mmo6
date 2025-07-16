import { io } from 'https://cdn.socket.io/4.4.1/socket.io.esm.min.js';
import { getCurrentUser, logout } from './js/auth/auth.js';

// Create socket instance
const socket = io();

// Track connection status
let isConnected = false;
let isAuthenticated = false;

// Connect to the server
socket.on('connect', () => {
    console.log('[/client/socket.js - connect] Connected to server');
    isConnected = true;
    
    // Authenticate with the server if we have a user
    authenticateSocket();
});

// Handle disconnection
socket.on('disconnect', () => {
    console.log('[/client/socket.js - disconnect] Disconnected from server');
    isConnected = false;
    isAuthenticated = false;
});

// Handle authentication success
socket.on('authenticated', (data) => {
    console.log('[/client/socket.js - authenticated] Socket authenticated successfully');
    isAuthenticated = true;
});

// Handle authentication error
socket.on('authentication_error', (data) => {
    console.error('[/client/socket.js - authentication_error] Socket authentication failed:', data.message);
    isAuthenticated = false;
});

// Handle duplicate session detection
socket.on('duplicate_session', (data) => {
    console.warn('[/client/socket.js - duplicate_session] Duplicate session detected:', data.message);
    
    // Show alert to user
    alert(data.message);
    
    // Force logout and redirect to login page
    logout();
    window.location.href = '/login';
});

// Handle new login attempt notification
socket.on('new_login_attempt', (data) => {
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
    socket.emit('authenticate', {
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
        socket.emit('logout');
    }
    isAuthenticated = false;
});

// Export socket and functions for use in other modules
export { socket, authenticateSocket };
