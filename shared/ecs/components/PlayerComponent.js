/**
 * PlayerComponent - Identifies an entity as a player
 */
import { Component } from '../core/component.js';

export class PlayerComponent extends Component {
    constructor(isLocalPlayer = false, playerId = null) {
        super();
        this.isLocalPlayer = isLocalPlayer;
        this.playerId = playerId;
    }
}
