/**
 * AssetLoader - Manages loading of 3D models and other game assets
 */
import * as THREE from '/shared/modules/three.module.js ';
import { GLTFLoader } from '/shared/modules/GLTFLoader.js';

export class AssetLoader {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.loadedAssets = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load a GLTF/GLB model
     * @param {string} path - Path to the model file
     * @param {string} key - Unique key for caching
     * @returns {Promise<THREE.Group>} The loaded model
     */
    async loadModel(path, key = null) {
        const cacheKey = key || path;
        
        // Return cached asset if already loaded
        if (this.loadedAssets.has(cacheKey)) {
            return this.loadedAssets.get(cacheKey).clone();
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(cacheKey)) {
            const asset = await this.loadingPromises.get(cacheKey);
            return asset.clone();
        }

        // Create new loading promise
        const loadingPromise = new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    this.loadedAssets.set(cacheKey, model);
                    this.loadingPromises.delete(cacheKey);
                    resolve(model);
                },
                (progress) => {
                    console.log(`Loading ${path}: ${(progress.loaded / progress.total * 100)}%`);
                },
                (error) => {
                    console.error(`Error loading ${path}:`, error);
                    this.loadingPromises.delete(cacheKey);
                    reject(error);
                }
            );
        });

        this.loadingPromises.set(cacheKey, loadingPromise);
        const asset = await loadingPromise;
        return asset.clone();
    }

    /**
     * Preload multiple assets
     * @param {Array<{path: string, key: string}>} assets
     * @returns {Promise<void>}
     */
    async preloadAssets(assets) {
        const promises = assets.map(asset => 
            this.loadModel(asset.path, asset.key)
        );
        await Promise.all(promises);
    }

    /**
     * Get a cached asset
     * @param {string} key - Asset key
     * @returns {THREE.Group|null} Cloned asset or null
     */
    getAsset(key) {
        const asset = this.loadedAssets.get(key);
        return asset ? asset.clone() : null;
    }

    /**
     * Check if an asset is loaded
     * @param {string} key - Asset key
     * @returns {boolean}
     */
    isLoaded(key) {
        return this.loadedAssets.has(key);
    }

    /**
     * Clear all cached assets
     */
    clearCache() {
        this.loadedAssets.clear();
        this.loadingPromises.clear();
    }
}

// Create singleton instance
export const assetLoader = new AssetLoader();
