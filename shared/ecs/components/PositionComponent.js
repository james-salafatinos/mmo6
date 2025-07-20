/**
 * PositionComponent - Represents position in 3D space
 */
import { Component } from '../core/component.js';

export class PositionComponent extends Component {
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Set position
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Get distance to another position
     * @param {PositionComponent} other
     * @returns {number}
     */
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}
