/**
 * ChunkSystem - Manages chunk loading and unloading based on player position
 */
import { System } from '../core/system.js';
import { ChunkComponent } from '../components/ChunkComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';

export class ChunkSystem extends System {
    constructor(assetLoader, scene) {
        super();
        this.assetLoader = assetLoader;
        this.scene = scene;
        this.loadDistance = 2; // Load chunks within this distance (reduced)
        this.unloadDistance = 2; // Unload chunks beyond this distance
        this.chunkEntities = new Map(); // Map of "x,z" -> entity
        this.playerPosition = { x: 0, z: 0 };
        
        // Define which chunks are available 
        this.availableChunks = new Set([
            '1,1', '-1,1', '1,-1', '-1,-1'
        ]);
    }

    /**
     * Update the player position for chunk loading calculations
     * @param {number} x - Player X position
     * @param {number} z - Player Z position
     */
    updatePlayerPosition(x, z) {
        this.playerPosition.x = x;
        this.playerPosition.z = z;
    }

    /**
     * Get chunk coordinates from world position
     * @param {number} x - World X position
     * @param {number} z - World Z position
     * @param {number} chunkSize - Size of each chunk
     * @returns {{x: number, z: number}}
     */
    getChunkCoords(x, z, chunkSize) {
        return {
            x: Math.floor(x / chunkSize),
            z: Math.floor(z / chunkSize)
        };
    }

    /**
     * Load a chunk at the specified coordinates
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @returns {Promise<Entity>}
     */
    async loadChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        console.log(`Loading chunk ${chunkKey}`);
        
        // Don't load if already exists
        if (this.chunkEntities.has(chunkKey)) {
            return this.chunkEntities.get(chunkKey);
        }

        try {
            // Create chunk entity
            const entity = this.world.createEntity();
            
            // Add chunk component
            const chunkComponent = new ChunkComponent(chunkX, chunkZ);
            entity.addComponent(chunkComponent);
            
            // Add position component
            const worldPos = chunkComponent.getWorldPosition();
            const positionComponent = new PositionComponent(worldPos.x, 0, worldPos.z);
            entity.addComponent(positionComponent);
            
            // Load the 3D model
            const model = await this.assetLoader.loadModel(
                chunkComponent.getAssetPath(),
                chunkComponent.getChunkKey()
            );
            
            // Position the model
            model.position.set(worldPos.x, 0, worldPos.z);
            
            // Add render component
            const renderComponent = new RenderComponent(model);
            entity.addComponent(renderComponent);
            
            // Add to scene
            this.scene.add(model);
            
            // Mark as loaded
            chunkComponent.loaded = true;
            chunkComponent.visible = true;
            chunkComponent.model = model;
            
            // Store entity reference
            this.chunkEntities.set(chunkKey, entity);
            
            console.log(`Loaded chunk ${chunkKey}`);
            return entity;
            
        } catch (error) {
            console.error(`Failed to load chunk ${chunkKey}:`, error);
            return null;
        }
    }

    /**
     * Unload a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     */
    unloadChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        const entity = this.chunkEntities.get(chunkKey);
        
        if (entity) {
            const renderComponent = entity.getComponent(RenderComponent);
            if (renderComponent && renderComponent.object3D) {
                this.scene.remove(renderComponent.object3D);
            }
            
            this.world.removeEntity(entity);
            this.chunkEntities.delete(chunkKey);
            console.log(`Unloaded chunk ${chunkKey}`);
        }
    }

    /**
     * Update system - manages chunk loading/unloading
     * @param {number} deltaTime
     */
    update(deltaTime) {
        const playerChunk = this.getChunkCoords(
            this.playerPosition.x, 
            this.playerPosition.z
        );

        // Determine which chunks should be loaded
        const chunksToLoad = [];
        for (let x = playerChunk.x - this.loadDistance; x <= playerChunk.x + this.loadDistance; x++) {
            for (let z = playerChunk.z - this.loadDistance; z <= playerChunk.z + this.loadDistance; z++) {
                const chunkKey = `${x},${z}`;
                // Only load chunks that are available and not already loaded
                if (this.availableChunks.has(chunkKey) && !this.chunkEntities.has(chunkKey)) {
                    chunksToLoad.push({ x, z });
                }
            }
        }

        // Load new chunks
        chunksToLoad.forEach(chunk => {
            this.loadChunk(chunk.x, chunk.z);
        });

        // Unload distant chunks
        const chunksToUnload = [];
        this.chunkEntities.forEach((entity, chunkKey) => {
            const [x, z] = chunkKey.split(',').map(Number);
            const distance = Math.max(
                Math.abs(x - playerChunk.x),
                Math.abs(z - playerChunk.z)
            );
            
            if (distance > this.unloadDistance) {
                chunksToUnload.push({ x, z });
            }
        });

        chunksToUnload.forEach(chunk => {
            this.unloadChunk(chunk.x, chunk.z);
        });
    }
}
