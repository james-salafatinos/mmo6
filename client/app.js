// Main application entry point
import { initThreeJS, getScene, getCamera, render } from '/client/three-setup.js';
import { initAuth, isAuthenticated, getCurrentUser } from '/client/js/auth/auth.js';
import { socket, authenticateSocket } from '/client/socket.js';
import { initAdmin } from '/client/js/admin.js';

let sceneContainerId = 'scene-container';// Initialize modules

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize authentication
    console.log('[/client/app.js - DOMContentLoaded] Initializing authentication...');
    const user = await initAuth();
    if (user) {
        console.log('[/client/app.js - DOMContentLoaded] User authenticated:', user.username);
        
        initAdmin();
    } else {
        console.log('[/client/app.js - DOMContentLoaded] No authenticated user');
        // Redirect to login if not on login page
        if (!window.location.pathname.endsWith('login')) {
            window.location.href = '/login';
            return;
        }
    }
    
    // Initialize Three.js
    initThreeJS(sceneContainerId);
    const scene = getScene();
    const camera = getCamera();

    // Render loop
    function animate() {
        requestAnimationFrame(animate);
        render();
    }
    animate();

});