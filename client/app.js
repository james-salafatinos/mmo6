// Main application entry point
import { initThreeJS, getScene, getCamera, render } from './three-setup.js';
let sceneContainerId = 'scene-container';// Initialize modules

document.addEventListener('DOMContentLoaded', () => {
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