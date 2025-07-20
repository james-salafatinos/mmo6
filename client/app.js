// Main application entry point
import { initThreeJS, getScene, getCamera, getRenderer, render } from '/client/three-setup.js';
import { initAuth, isAuthenticated, getCurrentUser } from '/client/js/auth/auth.js';
import { socket, authenticateSocket } from '/client/socket.js';
import { initAdmin } from '/client/js/admin.js';
import { GameManager } from '/client/js/GameManager.js';

let sceneContainerId = 'scene-container';
let gameManager = null;

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
    const renderer = getRenderer();

    // Initialize Game Manager
    gameManager = new GameManager(scene, camera, renderer);
    await gameManager.init();

    console.log('[app.js] Game initialized successfully');

    // Render loop
    function animate(currentTime) {
        requestAnimationFrame(animate);
        
        // Update game logic
        if (gameManager) {
            gameManager.update(currentTime);
        }
        
        render();
    }
    animate();

});