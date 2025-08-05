/**
 * ChunkComponent - Represents a world chunk
 */
import { Component } from '../core/component.js';

export class ChunkComponent extends Component {
    constructor(x, z, model = null) {
        super();
        this.x = x;           // Chunk X coordinate
        this.z = z;           // Chunk Z coordinate
        this.model = model;   // Three.js model/group
        this.loaded = false;  // Whether the chunk is loaded
        this.visible = false; // Whether the chunk is visible
        this.size = 1;       // Chunk size in world units
        this.BLENDER_SCALE_FACTOR = 10000;
    }

    /**
     * Get the world position of this chunk
     * Positions chunks so they meet at the origin (0,0)
     * @returns {{x: number, z: number}}
     */
    getWorldPosition() {
        return {
            x: (this.x * this.size) / this.BLENDER_SCALE_FACTOR,
            z: (this.z * this.size) / this.BLENDER_SCALE_FACTOR
        };
    }

    /**
     * Get the chunk key for asset loading
     * @returns {string}
     */
    getChunkKey() {
        return `chunk_${this.x}_${this.z}`;
    }

    /**
     * Get the asset path for this chunk
     * @returns {string}
     */
    getAssetPath() {
        return `/shared/models/chunks/${this.getChunkKey()}.glb`;
    }
}
