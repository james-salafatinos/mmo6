/**
 * GameManager - Main game logic and ECS integration
 */
import { World } from '/shared/ecs/core/index.js';
import { ChunkSystem } from '/shared/ecs/systems/ChunkSystem.js';
import { RenderSystem } from '/shared/ecs/systems/RenderSystem.js';
import { RenderComponent } from '/shared/ecs/components/RenderComponent.js';
import { TransformComponent } from '/shared/ecs/components/TransformComponent.js';
import { MovementComponent } from '/shared/ecs/components/MovementComponent.js';
import { CharacterComponent } from '/shared/ecs/components/CharacterComponent.js';
import { assetLoader } from './AssetLoader.js';

import { InputComponent } from '/shared/ecs/components/InputComponent.js';
import { InputSystem } from '/shared/ecs/systems/InputSystem.js';
import { CharacterSystem } from '/shared/ecs/systems/CharacterSystem.js';

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
        this.inputSystem = new InputSystem(renderer);
        this.characterSystem = new CharacterSystem(scene);


        // Register systems with world
        this.world.registerSystem(this.chunkSystem);
        this.world.registerSystem(this.renderSystem);
        this.world.registerSystem(this.inputSystem);
        this.world.registerSystem(this.characterSystem);



        // Initialize systems
        this.world.init();

        // Input state (legacy - will be replaced by InputComponent)
        this.input = {
            isMoving: false,
            isRunning: false,
            targetPosition: new THREE.Vector3(),
            keys: {}
        };

        // Setup lighting
        this.setupLighting();

        // Create character entity after systems are initialized
        this.createCharacterEntity();

        console.log('@@@@@@@', this.characterEntity)
        // Load character model and animations via CharacterSystem
        this.characterSystem.loadCharacterModel(this.characterEntity);

        console.log('[GameManager] Initialized with ECS systems');
    }

    createCharacterEntity() {
        // Create character entity
        this.characterEntity = this.world.createEntity();



        // Add components to entity
        this.characterEntity.addComponent(new InputComponent());
        this.characterEntity.addComponent(new TransformComponent());
        this.characterEntity.addComponent(new CharacterComponent());
        this.characterEntity.addComponent(new MovementComponent());
        this.characterEntity.addComponent(new InputComponent());

        // Store the entity ID for consistent reference
        this.characterEntityId = this.characterEntity.id;

        console.log('[Game] Created character entity with components:', this.characterEntity);
        console.log('[Game] Added InputComponent to character entity');
    }



    // Helper method to get the character entity using the stored ID
    getCharacterEntity() {
        // If we have a stored ID, find the entity by ID
        if (this.characterEntityId !== undefined) {
            // Find the entity in the world by its ID
            const entity = this.world.entities.find(e => e.id === this.characterEntityId);
            if (entity) {
                return entity;
            } else {
                console.error(`[Game] Could not find entity with ID ${this.characterEntityId}`);
            }
        }

        // Fallback to the direct reference (though this might be stale)
        return this.characterEntity;
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
