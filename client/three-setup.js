// Three.js initialization and setup
import * as THREE from '/client/modules/three.module.js';
import { OrbitControls } from '/client/modules/OrbitControls.js';

// Module variables
let scene, camera, renderer, controls;
let container;

/**
 * Initialize the Three.js environment
 * @returns {Object} The Three.js scene
 */
export function initThreeJS(containerId) {
    // Get the container element
    container = document.getElementById(containerId);
    
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    // Create the camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 5;
    
    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 0.8;
    controls.minDistance = 5;
    controls.maxDistance = 10;
    
    // Limit vertical rotation (in radians)
    controls.minPolarAngle = Math.PI / 6;  // 30 degrees from top (can't look straight down)
    controls.maxPolarAngle = Math.PI / 2; 
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    return scene;
}

/**
 * Handle window resize
 */
function onWindowResize() {
    // Update camera
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Get the Three.js scene
 * @returns {THREE.Scene} The scene
 */
export function getScene() {
    return scene;
}

/**
 * Get the Three.js camera
 * @returns {THREE.Camera} The camera
 */
export function getCamera() {
    return camera;
}

/**
 * Get the orbit controls
 * @returns {OrbitControls} The orbit controls
 */
export function getControls() {
    return controls;
}

/**
 * Get the Three.js renderer
 * @returns {THREE.WebGLRenderer} The renderer
 */
export function getRenderer() {
    return renderer;
}

/**
 * Render the scene
 */
export function render() {
    // Always update controls to ensure smooth damping
    if (controls) {
        controls.update();
    }
    renderer.render(scene, camera);
}


