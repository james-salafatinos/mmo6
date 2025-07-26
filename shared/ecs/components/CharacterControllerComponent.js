/**
 * CharacterControllerComponent - Manages character controller instance
 */
import { Component } from '../core/component.js';

export class CharacterControllerComponent extends Component {
    constructor(controller = null) {
        super();
        this.controller = controller;
    }

    /**
     * Set the character controller instance
     * @param {BasicCharacterController} controller 
     */
    setController(controller) {
        this.controller = controller;
    }
}
