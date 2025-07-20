/**
 * GameManager - Main game logic and ECS integration
 */
import { World } from '/shared/ecs/core/index.js';
import { ChunkSystem } from '/shared/ecs/systems/ChunkSystem.js';
import { RenderSystem } from '/shared/ecs/systems/RenderSystem.js';
import { assetLoader } from './AssetLoader.js';

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
        
        // Player position (for chunk loading)
        this.playerPosition = { x: 0, y: 0, z: 0 };
        
        console.log('[GameManager] Initialized with ECS systems');
    }

    /**
     * Initialize the game - load initial chunks
     */
    async init() {
        console.log('[GameManager] Loading initial chunks...');
        
        // Update chunk system with player position
        this.chunkSystem.updatePlayerPosition(this.playerPosition.x, this.playerPosition.z);
        
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

    /**
     * Update player position (for chunk loading)
     * @param {number} x - Player X position
     * @param {number} y - Player Y position  
     * @param {number} z - Player Z position
     */
    updatePlayerPosition(x, y, z) {
        this.playerPosition.x = x;
        this.playerPosition.y = y;
        this.playerPosition.z = z;
        
        // Update chunk system
        this.chunkSystem.updatePlayerPosition(x, z);
    }

    /**
     * Get the ECS world instance
     * @returns {World}
     */
    getWorld() {
        return this.world;
    }

    /**
     * Get chunk system reference
     * @returns {ChunkSystem}
     */
    getChunkSystem() {
        return this.chunkSystem;
    }
}
