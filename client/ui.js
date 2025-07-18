/**
 * UI.js - Handles UI-related functionality
 */
import { logout } from '/client/js/auth/auth.js';
import { socket } from '/client/socket.js';
import { AUTH_EVENTS } from '/shared/SocketEventDefinitions.js';

/**
 * Update the user count display in the UI
 * @param {number} count - Number of online users
 */
export function updateUserCountDisplay(count) {
    const userCountElement = document.getElementById('user-count');
    if (userCountElement) {
        console.log(`[/client/js/ui.js - updateUserCountDisplay] Updating user count: ${count}`);
        userCountElement.textContent = count === 1 ? '1 user online' : `${count} users online`;
    }
}

/**
 * Set up the logout button click handler
 */
export function setupLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        console.log('[/client/js/ui.js - setupLogoutButton] Setting up logout button handler');
        logoutButton.addEventListener('click', async () => {
            console.log('[/client/js/ui.js - logoutButton.click] Logout button clicked');
            
            try {
                // First, disconnect the socket to prevent duplicate tab issues
                if (socket && socket.connected) {
                    console.log('[/client/js/ui.js - logoutButton.click] Disconnecting socket');
                    socket.emit(AUTH_EVENTS.LOGOUT);
                }
                
                // Then perform the actual logout through auth.js
                const success = await logout();
                
                if (success) {
                    console.log('[/client/js/ui.js - logoutButton.click] Logout successful, redirecting to login page');
                    window.location.href = '/login';
                } else {
                    console.error('[/client/js/ui.js - logoutButton.click] Logout failed');
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('[/client/js/ui.js - logoutButton.click] Error during logout:', error);
                alert('An error occurred during logout. Please try again.');
            }
        });
    } else {
        console.warn('[/client/js/ui.js - setupLogoutButton] Logout button not found in the DOM');
    }
}
