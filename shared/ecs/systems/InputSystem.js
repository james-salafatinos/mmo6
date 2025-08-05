/**
 * InputSystem - Processes input events and updates InputComponents
 */
import { System } from '../core/system.js';
import { InputComponent } from '/shared/ecs/components/InputComponent.js';
import { CharacterComponent } from '/shared/ecs/components/CharacterComponent.js';

export class InputSystem extends System {
    constructor(renderer) {
        super();
        this.renderer = renderer;
        this.keys = {};
        this.input = {
            isMoving: false,
            isRunning: false,
            targetPosition: null,
            keys: {}
        };
        this.setupInputListeners();
    }

    /**
     * Set up DOM event listeners for input
     */
    setupInputListeners() {
        // Keyboard input
        window.addEventListener('keydown', (event) => {
            this.handleKeyEvent(event.key.toLowerCase(), true);
        });

        window.addEventListener('keyup', (event) => {
            this.handleKeyEvent(event.key.toLowerCase(), false);
        });

        // Mouse input for click-to-move (if needed)
        if (this.renderer) {
            this.renderer.domElement.addEventListener('click', (event) => {
                this.handleMouseClick(event);
            });
        }
    }
  
    /**
     * Handle keyboard events
     * @param {string} key - The key that was pressed/released
     * @param {boolean} isPressed - Whether the key was pressed (true) or released (false)
     */
    handleKeyEvent(key, isPressed) {
        // Update local key state
        this.keys[key] = isPressed;
        
        // Process all entities with InputComponent
        this.world.getEntitiesWithComponent('InputComponent').forEach(entity => {
            const inputComponent = entity.getComponent('InputComponent');
            inputComponent.setKey(key, isPressed);
        });
        
        // Update input state and trigger animations
        this.updateInputState();
    }

    /**
     * Handle mouse click events for click-to-move
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseClick(event) {
        // This would be implemented if click-to-move is needed
        // For now, it's a placeholder for future functionality
    }

    /**
     * Update input state and trigger character animations
     */
    updateInputState() {
        // Update movement state based on WASD keys
        const isW = this.keys['w'] || false;
        const isA = this.keys['a'] || false;
        const isS = this.keys['s'] || false;
        const isD = this.keys['d'] || false;
        
        // Character is moving if any movement key is pressed
        const wasMoving = this.input.isMoving;
        this.input.isMoving = isW || isA || isS || isD;
        
        // Character is running if shift is held
        const wasRunning = this.input.isRunning;
        this.input.isRunning = this.keys['shift'] || false;
        
        // Update the input.keys object
        this.input.keys = { ...this.keys };
        
        // Only log when state changes to avoid console spam
        if (wasMoving !== this.input.isMoving || wasRunning !== this.input.isRunning) {
            console.log(`Input state changed: moving=${this.input.isMoving}, running=${this.input.isRunning}`);
            
            // Force state update on character component when movement state changes
            if (this.world) {
                const characterEntities = this.world.getEntitiesWith(CharacterComponent);
                characterEntities.forEach(entity => {
                    const characterComponent = entity.getComponent('CharacterComponent');
                    if (characterComponent) {
                        if (this.input.isMoving && !wasMoving) {
                            characterComponent.changeState(this.input.isRunning ? 'run' : 'walk');
                        } else if (!this.input.isMoving && wasMoving) {
                            characterComponent.changeState('idle');
                        } else if (this.input.isMoving && this.input.isRunning !== wasRunning) {
                            characterComponent.changeState(this.input.isRunning ? 'run' : 'walk');
                        }
                    }
                });
            }
        }
    }

    /**
     * Update method called each frame
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Any per-frame input processing can be done here
        // For example, gamepad input or continuous input checks
    }
}