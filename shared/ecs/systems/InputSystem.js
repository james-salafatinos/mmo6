/**
 * InputSystem - Handles click-to-move input with raycasting
 */
import * as THREE from 'three';

export class InputSystem {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.world = null;

        this.setupEventListeners();
        console.log('[InputSystem] Initialized click-to-move input system');
    }

    setupEventListeners() {
        // Listen for mouse clicks on the canvas
        document.addEventListener('click', (event) => {
            this.handleClick(event);
        });
    }

    handleClick(event) {
        if (!this.world) return;

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all objects in the scene that can be clicked (chunks/ground)
        const intersectableObjects = [];
        this.scene.traverse((child) => {
            // Look for chunk meshes or ground objects
            if (child.isMesh && (child.userData.isChunk || child.userData.isGround)) {
                intersectableObjects.push(child);
            }
        });

        // Perform raycast
        const intersects = this.raycaster.intersectObjects(intersectableObjects, true);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const clickPosition = intersection.point;

            console.log(`[InputSystem] Click detected at position: ${clickPosition.x.toFixed(2)}, ${clickPosition.y.toFixed(2)}, ${clickPosition.z.toFixed(2)}`);

        }
    }

    setWorld(world) {
        this.world = world;
    }
}
