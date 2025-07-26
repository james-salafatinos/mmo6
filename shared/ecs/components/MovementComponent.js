/**
 * MovementComponent - Handles movement state and target position
 */
import { Component } from '../core/component.js';
import * as THREE from '/shared/modules/three.module.js ';

export class MovementComponent extends Component {
    constructor() {
        super();
        this.isMoving = false;
        this.targetPosition = new THREE.Vector3();
        this.speed = 5.0; // Units per second
        this.rotationSpeed = 10.0; // Radians per second
        this.stoppingDistance = 0.1; // How close to target before stopping
        this.hasTarget = false;
    }

    /**
     * Set a new target position to move towards
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    setTarget(x, y, z) {
        this.targetPosition.set(x, y, z);
        this.hasTarget = true;
        this.isMoving = true;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    setRotationSpeed(rotationSpeed) {
        this.rotationSpeed = rotationSpeed;
    }

    /**
     * Stop movement
     */
    stopMovement() {
        this.isMoving = false;
        this.hasTarget = false;
    }

    /**
     * Get distance to target
     * @param {THREE.Vector3} currentPosition 
     * @returns {number}
     */
    getDistanceToTarget(currentPosition) {
        return currentPosition.distanceTo(this.targetPosition);
    }
}
