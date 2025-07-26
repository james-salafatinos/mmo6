/**
 * GameManager - Main game logic and ECS integration
 */
import { World } from '/shared/ecs/core/index.js';
import { ChunkSystem } from '/shared/ecs/systems/ChunkSystem.js';
import { RenderSystem } from '/shared/ecs/systems/RenderSystem.js';
import { assetLoader } from './AssetLoader.js';
import * as THREE from '/shared/modules/three.module.js ';
export class GameManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        // Initialize ECS World
        this.world = new World();
        
        // Initialize Systems
        this.chunkSystem = new ChunkSystem(assetLoader, scene);
        this.renderSystem = new RenderSystem(scene);
        
        // Register systems with world
        this.world.registerSystem(this.chunkSystem);
        this.world.registerSystem(this.renderSystem);
        
        // Initialize systems
        this.world.init();
        
        // Setup lighting
        this.setupLighting();
        
        
        console.log('[GameManager] Initialized with ECS systems');
    }

    /**
     * Initialize the game - load initial chunks
     */
    async init() {
        console.log('[GameManager] Loading initial chunks...');

        
        // Load initial chunks around origin (0,0)
        const initialChunks = [
            { x: -1, z: -1 },
            { x: -1, z: 1 },
            { x: 1, z: -1 },
            { x: 1, z: 1 }
        ];

        try {
            // Load chunks in parallel
            const loadPromises = initialChunks.map(chunk => 
                this.chunkSystem.loadChunk(chunk.x, chunk.z)
            );
            
            await Promise.all(loadPromises);
            console.log('[GameManager] Initial chunks loaded successfully');
        } catch (error) {
            console.error('[GameManager] Error loading initial chunks:', error);
        }
    }

    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        console.log('[GameManager] Lighting setup complete');
    }

    /**
     * Update the game world
     * @param {number} currentTime - Current time in milliseconds
     */
    update(currentTime) {
        // Convert to seconds for ECS
        const timeInSeconds = currentTime / 1000;
        
        // Update ECS world
        this.world.update(timeInSeconds);
    }


 
}
