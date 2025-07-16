// Login functionality
import { setCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showError('Username and password are required');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Special handling for account already in use
                if (data.error === 'Account already in use') {
                    showError(data.message || 'This account is currently in use on another device or browser');
                } else {
                    showError(data.error || 'Login failed');
                }
                return;
            }
            
            // Store user data using auth module
            console.log('[/client/js/auth/login.js - submit event handler] Setting current user:', data.user.username);
            setCurrentUser(data.user);
            
            // Redirect to game
            window.location.href = '/';
        } catch (error) {
            console.error('[/client/js/auth/login.js - submit event handler] Login error:', error);
            showError('An error occurred during login. Please try again.');
        }
    });
    
    // Helper function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }
    
});
