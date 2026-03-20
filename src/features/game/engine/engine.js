import { GAMEPHASE } from "./constants/gamePhase";
import { initPuck } from "../factories/puckFactory";
import { paddleStep } from "../physics/paddle/paddle";
import { puckStep } from "../physics/puck/puck";

export class Engine {
    constructor(settings, onUpdate) {
        this.settings = settings;
        this.onUpdate= onUpdate;
        this.state = {
                phase: GAMEPHASE.faceOff,
                period: 1,
                time: 0,
                player1: {
                    goals: 0,
                    position: 50 - (0.5 * settings.paddle.height)
                },
                player2: {
                    goals: 0,
                    position: 50 - (0.5 * settings.paddle.height)
                },
                puck: initPuck(settings)
            };
        this.keys = {z: false, s: false, up: false, down: false};
        this.running = false;
        this.lastTime = null;
        this.attackplayerPos= null;
        this.loop = this.loop.bind(this);
    }

    start() {
        if(this.running) return;
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        this.running = true;
        this.lastTime = null;
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.running= false;
        document.removeEventListener('keydown', this.handleKeyDown)
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    loop(time) {
        if (!this.running) return;
        
        if (this.lastTime === null) this.lastTime = time;
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        this.step(deltaTime);
        this.onUpdate(this.getSnapshot());
        requestAnimationFrame(this.loop);
    }

    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    step(deltaTime) {
        switch (this.state.phase) {
            case GAMEPHASE.faceOff:
                this.faceOffStep(deltaTime);
                break;
            case GAMEPHASE.playing:
                this.playingStep(deltaTime);
                break;
        }
    }

    faceOffStep(deltaTime) {

        if (!this.attackplayerPos) {
            this.attackplayerPos = this.state.player1.position;
        }
        if (this.state.puck.vx !== 0) {
            this.state.puck = initPuck(this.settings);
        }
        this.movingStep(deltaTime);
                
        if (this.state.puck.y >= (this.attackplayerPos + (0.5 * this.settings.paddle.height))) {
            
            this.state.puck.vx = this.settings.puck.defaultSpeed;
            this.state.puck.vy = 0;
            this.attackplayerPos = null;
            this.state.phase = GAMEPHASE.playing;
        }

    }

    playingStep(deltaTime) {
        this.state.time += deltaTime;
        this.movingStep(deltaTime);
    }

    movingStep(deltaTime) {
        this.state.player1.position = paddleStep(
            this.state.player1.position, 
            this.keys.z,
            this.keys.s,
            this.settings
        );
        this.state.player2.position = paddleStep(
            this.state.player2.position, 
            this.keys.up,
            this.keys.down,
            this.settings
        );
        this.state.puck = puckStep(this.state,deltaTime, this.settings);
    }
    
    handleKeyDown= (e) => {
        if(e.code === 'KeyW') {
            this.keys.z = true;
            return;
        }
        else if (e.code === 'KeyS') {
            this.keys.s = true;
            return;
        } else if (e.code === 'ArrowUp') {
            this.keys.up = true;
            return;
        }else if (e.code === 'ArrowDown') {
            this.keys.down= true;
        } else if (e.code === 'Space' 
            && (this.state.phase === GAMEPHASE.playing || this.state.phase === GAMEPHASE.pause)
            ) {
                this.state.phase = this.state.phase === GAMEPHASE.playing ? GAMEPHASE.pause : GAMEPHASE.playing ;
        }
    }

    handleKeyUp = (e) => {
        if(e.code === 'KeyW') {
            this.keys.z = false;
            return;
        }
        else if (e.code === 'KeyS') {
            this.keys.s = false;
            return;
        } else if (e.code === 'ArrowUp') {
            this.keys.up = false;
            return;
        }else if (e.code === 'ArrowDown') {
            this.keys.down= false;
        }
    }
}