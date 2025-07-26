/**
 * StateMachine - Character animation state machine for click-to-move
 */
import * as THREE from 'three';

export class FiniteStateMachine {
    constructor() {
        this._states = {};
        this._currentState = null;
    }

    _AddState(name, type) {
        this._states[name] = type;
    }

    SetState(name) {
        const prevState = this._currentState;

        if (prevState) {
            if (prevState.Name === name) {
                return;
            }
            prevState.Exit();
        }

        console.log(`[StateMachine] Setting state to '${name}'. Previous: ${prevState ? prevState.Name : 'null'}`);
        const state = new this._states[name](this);

        this._currentState = state;
        state.Enter(prevState);
    }

    Update(timeElapsed) {
        if (this._currentState) {
            this._currentState.Update(timeElapsed);
        }
    }
}

export class CharacterFSM extends FiniteStateMachine {
    constructor(proxy) {
        super();
        this._proxy = proxy;
        this._Init();
    }

    _Init() {
        this._AddState('idle', IdleState);
        this._AddState('walk', WalkState);
        this._AddState('run', RunState);
        this._AddState('dance', DanceState);
    }
}

export class State {
    constructor(parent) {
        this._parent = parent;
    }

    Enter(prevState) {}
    Exit() {}
    Update(timeElapsed, input) {}

    get Name() {
        return '';
    }
}

export class IdleState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'idle';
    }

    Enter(prevState) {
        if (!this._parent._proxy._animations['idle'] || !this._parent._proxy._animations['idle'].action) {
            console.warn('[IdleState] Idle animation not loaded yet');
            return;
        }
        
        const idleAction = this._parent._proxy._animations['idle'].action;
        if (prevState) {
            if (this._parent._proxy._animations[prevState.Name] && this._parent._proxy._animations[prevState.Name].action) {
                const prevAction = this._parent._proxy._animations[prevState.Name].action;
                idleAction.time = 0.0;
                idleAction.enabled = true;
                idleAction.setEffectiveTimeScale(1.0);
                idleAction.setEffectiveWeight(1.0);
                idleAction.crossFadeFrom(prevAction, 0.5, true);
                idleAction.play();
            } else {
                idleAction.play();
            }
        } else {
            idleAction.play();
        }
    }

    Exit() {}

    Update(_, input) {
        if (input.isMoving) {
            console.log('[IdleState] Transitioning to walk state');
            this._parent.SetState('walk');
        }
    }
}

export class WalkState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'walk';
    }

    Enter(prevState) {
        console.log(`[WalkState] Entering walk state from ${prevState ? prevState.Name : 'null'}`);
        if (!this._parent._proxy._animations['walk'] || !this._parent._proxy._animations['walk'].action) {
            console.warn('[WalkState] Walk animation not loaded yet');
            return;
        }
        
        const curAction = this._parent._proxy._animations['walk'].action;
        if (prevState) {
            if (this._parent._proxy._animations[prevState.Name] && this._parent._proxy._animations[prevState.Name].action) {
                const prevAction = this._parent._proxy._animations[prevState.Name].action;

                curAction.enabled = true;

                if (prevState.Name === 'run') {
                    const ratio = curAction.getClip().duration / prevAction.getClip().duration;
                    curAction.time = prevAction.time * ratio;
                } else {
                    curAction.time = 0.0;
                    curAction.setEffectiveTimeScale(1.0);
                    curAction.setEffectiveWeight(1.0);
                }

                curAction.crossFadeFrom(prevAction, 0.5, true);
                curAction.play();
            } else {
                curAction.play();
            }
        } else {
            curAction.play();
        }
    }

    Exit() {}

    Update(timeElapsed, input) {
        if (!input.isMoving) {
            console.log('[WalkState] Transitioning to idle state');
            this._parent.SetState('idle');
            return;
        }
    }
}

export class RunState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'run';
    }

    Enter(prevState) {
        const curAction = this._parent._proxy._animations['run'].action;
        if (prevState) {
            const prevAction = this._parent._proxy._animations[prevState.Name].action;

            curAction.enabled = true;

            if (prevState.Name === 'walk') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration;
                curAction.time = prevAction.time * ratio;
            } else {
                curAction.time = 0.0;
                curAction.setEffectiveTimeScale(1.0);
                curAction.setEffectiveWeight(1.0);
            }

            curAction.crossFadeFrom(prevAction, 0.5, true);
            curAction.play();
        } else {
            curAction.play();
        }
    }

    Exit() {}

    Update(timeElapsed, input) {
        if (!input.isMoving) {
            this._parent.SetState('idle');
            return;
        }
    }
}

export class DanceState extends State {
    constructor(parent) {
        super(parent);
        this._FinishedCallback = () => {
            this._Finished();
        };
    }

    get Name() {
        return 'dance';
    }

    Enter(prevState) {
        const curAction = this._parent._proxy._animations['dance'].action;
        const mixer = curAction.getMixer();
        mixer.addEventListener('finished', this._FinishedCallback);

        if (prevState) {
            const prevAction = this._parent._proxy._animations[prevState.Name].action;

            curAction.reset();
            curAction.setLoop(THREE.LoopOnce, 1);
            curAction.clampWhenFinished = true;
            curAction.crossFadeFrom(prevAction, 0.2, true);
            curAction.play();
        } else {
            curAction.play();
        }
    }

    _Finished() {
        this._Cleanup();
        this._parent.SetState('idle');
    }

    _Cleanup() {
        const action = this._parent._proxy._animations['dance'].action;
        if (action) {
            const mixer = action.getMixer();
            if (mixer) {
                mixer.removeEventListener('finished', this._FinishedCallback);
            }
        }
    }

    Exit() {
        this._Cleanup();
    }

    Update(_) {}
}
