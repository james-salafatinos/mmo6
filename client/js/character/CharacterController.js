/**
 * CharacterController - Main character controller for click-to-move functionality
 */
import * as THREE from '../shared/modules/three.module.js';
import { FBXLoader } from '../shared/modules/FBXLoader.js';
import { CharacterInput } from './CharacterInput.js';
import { CharacterFSM } from './StateMachine.js';

export class CharacterControllerProxy {
    constructor(animations) {
        this._animations = animations;
    }

    get animations() {
        return this._animations;
    }
}

export class CharacterController {
    constructor(params) {
        this._Init(params);
    }

    _Init(params) {
        this._params = params;
        this._animations = {};
        this._input = new CharacterInput();
        this._stateMachine = new CharacterFSM(
            new CharacterControllerProxy(this._animations)
        );
        this._animationsLoaded = false;

        this._pendingInitialState = params.initialIsMoving ? "walk" : "idle";
        console.log(`[CharacterController] Initializing for entity ${params.entityId}`);

        this._target = null; // Will hold the character model
        this._mixer = null; // Animation mixer

        this._world 


        this._LoadModels();
    }

    _LoadModels() {
        const entityId = this._params.entityId || "unknown";
        console.log(`[CharacterController] Loading model for entity ${entityId}`);

        const loader = new FBXLoader();
        const modelPath = this._params.assetPath || "/client/models/character/";
        const modelFile = this._params.modelFile || "model.fbx";
        const modelScale = this._params.modelScale || 0.01;

        loader.setPath(modelPath);
        loader.load(
            modelFile,
            (fbx) => {
                console.log(`[CharacterController] Model loaded for entity ${entityId}`);

                fbx.scale.setScalar(modelScale);
                fbx.traverse((c) => {
                    c.castShadow = true;
                    c.receiveShadow = true;
                });

                this._target = fbx;
                if (!this._params.scene) {
                    console.error(`[CharacterController] No scene provided for entity ${entityId}`);
                    return;
                }

                // Add entity ID to userData for raycasting
                this._target.userData.entityId = entityId;
                this._target.traverse((child) => {
                    child.userData.entityId = entityId;
                });

                this._params.scene.add(this._target);
                console.log(`[CharacterController] Added model to scene for entity ${entityId}`);

                this._mixer = new THREE.AnimationMixer(this._target);

                const manager = new THREE.LoadingManager();
                manager.onLoad = () => {
                    this._animationsLoaded = true;
                    console.log(`[CharacterController] All animations loaded for entity ${entityId}`);
                    this._stateMachine.SetState(this._pendingInitialState);
                };

                const _OnLoad = (animName, anim) => {
                    if (anim.animations && anim.animations.length > 0) {
                        const clip = anim.animations[0];
                        const action = this._mixer.clipAction(clip);
                        this._animations[animName] = {
                            clip: clip,
                            action: action,
                        };
                        console.log(`[CharacterController] Animation '${animName}' loaded for entity ${entityId}`);
                    } else {
                        console.warn(`[CharacterController] Animation ${animName} has no data for entity ${entityId}`);
                    }
                };

                const animLoader = new FBXLoader(manager);
                animLoader.setPath(modelPath);

                const animationFiles = this._params.animationFiles || {
                    idle: "idle.fbx",
                    walk: "walk.fbx",
                    run: "run.fbx",
                    dance: "dance.fbx",
                };

                console.log(`[CharacterController] Loading animations: ${Object.keys(animationFiles).join(", ")}`);

                for (const animName in animationFiles) {
                    if (animationFiles.hasOwnProperty(animName)) {
                        animLoader.load(
                            animationFiles[animName],
                            (anim) => _OnLoad(animName, anim),
                            undefined,
                            (error) => {
                                console.error(`[CharacterController] Error loading animation ${animName}:`, error);
                            }
                        );
                    }
                }
            },
            undefined,
            (error) => {
                console.error(`[CharacterController] Error loading character model for entity ${entityId}:`, error);
            }
        );
    }

    get Position() {
        return this._target ? this._target.position.clone() : new THREE.Vector3();
    }

    get Rotation() {
        if (!this._target) {
            return new THREE.Quaternion();
        }
        return this._target.quaternion.clone();
    }

    Update(entityId, deltaTime, movementComponent, transformComponent) {
        if (!this._target || !this._mixer || !movementComponent || !transformComponent) {
            return;
        }

   
        const movementComponent = this._world.getComponent(entityId, MovementComponent);

        // Update state machine if animations are loaded
        if (this._animationsLoaded) {
            this._stateMachine.Update(deltaTime);
        } else {
            // Store desired state for when animations load
            if (movementComponent.isMoving) {
                this._pendingInitialState = "walk";
            } else if (this._pendingInitialState !== "walk") {
                this._pendingInitialState = "idle";
            }
        }

        // Update transform
        this._target.position.copy(transformComponent.position);
        this._target.quaternion.setFromEuler(transformComponent.rotation);

        // Update collider
        if (this._playerCollider) {
            this._playerCollider.center.copy(this._target.position);
        }

        // Update animation mixer
        this._mixer.update(deltaTime);
    }

    SetPosition(x, y, z) {
        if (this._target) {
            this._target.position.set(x, y, z);
            this._playerCollider.center
                .copy(this._target.position)
                .add(new THREE.Vector3(0, this._playerCollider.radius, 0));
        }
    }
}
