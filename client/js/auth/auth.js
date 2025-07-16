
let currentUser = null;
let sessionCheckInterval = null;
const SESSION_CHECK_INTERVAL = 100000; 

/**
 * Initialize the authentication module
 * @returns {Promise<Object|null>} The current user if authenticated, null otherwise
 */
export async function initAuth() {
    try {
        console.log('[/client/js/auth/auth.js - initAuth] Initializing authentication module');
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
            console.log('[/client/js/auth/auth.js - initAuth] Found stored user, verifying session');
            // Parse stored user data
            currentUser = JSON.parse(storedUser);
            console.log('[/client/js/auth/auth.js - initAuth] User data:', { username: currentUser.username, sessionExpires: currentUser.expiresAt });
            
            // Verify with server that session is still valid
            const response = await fetch('/api/auth/status', {
                headers: {
                    'x-session-token': currentUser.sessionToken
                }
            });
            const data = await response.json();
            console.log('[/client/js/auth/auth.js - initAuth] Session status response:', data);
            
            if (data.sessionEnded) {
                console.log('[/client/js/auth/auth.js - initAuth] Session was terminated due to login from another location');
                // This session was terminated because user logged in elsewhere
                localStorage.removeItem('user');
                currentUser = null;
                
                // Notify the user if we're not already on the login page
                if (!window.location.pathname.endsWith('login')) {
                    alert('This session has been terminated because you logged in from another location.');
                    window.location.href = '/login';
                }
                return null;
            }
            
            if (!data.authenticated) {
                console.log('[/client/js/auth/auth.js - initAuth] Session expired or invalid');
                // Session expired or invalid, clear local storage
                localStorage.removeItem('user');
                currentUser = null;
                return null;
            }
            
            console.log('[/client/js/auth/auth.js - initAuth] Session is valid');
            
            // Start session checking if not already started
            if (!sessionCheckInterval) {
                startSessionChecking();
            }
            
            return currentUser;
        }
        
        return null;
    } catch (error) {
        console.error('[/client/js/auth/auth.js - initAuth] Error initializing auth:', error);
        return null;
    }
}

// Start periodic session checking
function startSessionChecking() {
    console.log('[/client/js/auth/auth.js - startSessionChecking] Starting periodic session checking');
    if (sessionCheckInterval) {
        console.log('[/client/js/auth/auth.js - startSessionChecking] Clearing existing session check interval');
        clearInterval(sessionCheckInterval);
    }
    
    sessionCheckInterval = setInterval(async () => {
        try {
            console.log('[/client/js/auth/auth.js - startSessionChecking] Performing periodic session check');
            // Only check if we have a current user
            if (!currentUser) {
                console.log('[/client/js/auth/auth.js - startSessionChecking] No current user, skipping session check');
                return;
            }
            
            const response = await fetch('/api/auth/status', {
                headers: {
                    'x-session-token': currentUser.sessionToken
                }
            });
            const data = await response.json();
            console.log('[/client/js/auth/auth.js - startSessionChecking] Periodic check response:', data);
            
            if (!data.authenticated) {
                console.log('[/client/js/auth/auth.js - startSessionChecking] Session is no longer valid in periodic check');
                // Session is no longer authenticated
                localStorage.removeItem('user');
                currentUser = null;
                
                if (sessionCheckInterval) {
                    console.log('[/client/js/auth/auth.js - startSessionChecking] Clearing interval due to invalid session');
                    clearInterval(sessionCheckInterval);
                    sessionCheckInterval = null;
                }
                
                // If session was specifically ended, show that message
                if (data.sessionEnded) {
                    console.log('[/client/js/auth/auth.js - startSessionChecking] Session was terminated on server');
                    // Notify user and redirect to login
                    alert(data.message || 'Your session has ended. Please log in again.');
                }
                
                // Redirect to login if not already there
                if (!window.location.pathname.endsWith('login')) {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            console.error('[/client/js/auth/auth.js - startSessionChecking] Error checking session:', error);
        }
    }, SESSION_CHECK_INTERVAL);
}

/**
 * Get the current authenticated user
 * @returns {Object|null} The current user if authenticated, null otherwise
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isAuthenticated() {
    return currentUser !== null;
}

/**
 * Logout the current user
 * @returns {Promise<boolean>} True if logout was successful, false otherwise
 */
export async function logout() {
    try {
        console.log('[/client/js/auth/auth.js - logout] Attempting to logout');
        if (!currentUser || !currentUser.sessionToken) {
            console.log('[/client/js/auth/auth.js - logout] No current user or session token, logout failed');
            return false;
        }
        
        console.log('[/client/js/auth/auth.js - logout] Sending logout request to server');
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'x-session-token': currentUser.sessionToken
            }
        });
        
        if (response.ok) {
            console.log('[/client/js/auth/auth.js - logout] Logout successful, clearing user data');
            // Clear local storage and current user
            localStorage.removeItem('user');
            currentUser = null;
            
            // Clear the session checking interval
            if (sessionCheckInterval) {
                console.log('[/client/js/auth/auth.js - logout] Clearing session check interval');
                clearInterval(sessionCheckInterval);
                sessionCheckInterval = null;
            }
            
            // Dispatch logout event for socket
            const logoutEvent = new CustomEvent('userLoggedOut');
            document.dispatchEvent(logoutEvent);
            console.log('[/client/js/auth/auth.js - logout] Dispatched userLoggedOut event');
            
            return true;
        }
        
        console.log('[/client/js/auth/auth.js - logout] Server rejected logout request');
        return false;
    } catch (error) {
        console.error('[/client/js/auth/auth.js - logout] Error logging out:', error);
        return false;
    }
}

/**
 * Set the current user
 * @param {Object} user - The user object
 */
export function setCurrentUser(user) {
    console.log('[/client/js/auth/auth.js - setCurrentUser] Setting current user:', user ? user.username : 'null');
    currentUser = user;
    
    if (user) {
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Start session checking
        startSessionChecking();
        
        // Dispatch login event for socket authentication
        const loginEvent = new CustomEvent('userLoggedIn', { detail: user });
        document.dispatchEvent(loginEvent);
        console.log('[/client/js/auth/auth.js - setCurrentUser] Dispatched userLoggedIn event');
    } else {
        // Clear localStorage
        localStorage.removeItem('user');
        
        // Clear session checking
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
            sessionCheckInterval = null;
        }
    }
}
