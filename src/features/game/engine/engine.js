import { GAMEPHASE } from "./constants/gamePhase";
import { initPuck } from "../factories/puckFactory";
import { paddleStep } from "../physics/paddle/paddle";
import { hasPuckReachEndOfGoal, puckStep, simplePuckStep } from "../physics/puck/puck";

export class Engine {
    constructor(settings, onUpdate) {
        this.settings = settings;
        this.onUpdate= onUpdate;
        this.state = {
                phase: GAMEPHASE.faceOff,
                period: 1,
                time: 0,
                player1: {
                    id: 'p1',
                    goals: [],
                    position: 50 - (0.5 * settings.paddle.height)
                },
                player2: {
                    id: 'p2',
                    goals: [],
                    position: 50 - (0.5 * settings.paddle.height)
                },
                puck: initPuck(settings)
            };
        this.keys = {z: false, s: false, up: false, down: false};
        this.running = false;
        this.lastTime = null;
        this.firstAttacker = this.state.player1.id;
        this.attackplayer= null;
        this.suspendedAnimation = null;
        this.lastScorer = null;
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
            case GAMEPHASE.goal:
                this.goalStep(deltaTime);
                break;
            case GAMEPHASE.timeout:
                this.timeoutStep(deltaTime);
        }
    }

    faceOffStep(deltaTime) {
        if (!this.attackplayer) {
            const players = [
                    this.state.player1,
                    this.state.player2
                ];
            const targetId = this.lastScorer ?? this.firstAttacker;
            this.attackplayer = players.find(player => player.id === targetId);
        }
        if (this.state.puck.vx !== 0) {
            this.state.puck = initPuck(this.settings);
        }
        this.MovingStepNoCollision(deltaTime);
                
        if (this.state.puck.y >= (this.attackplayer.position + (0.5 * this.settings.paddle.height))) {
            
            this.state.puck.vx = this.attackplayer.id === this.state.player1.id
                                         ? this.settings.puck.defaultSpeed
                                         : this.settings.puck.defaultSpeed * -1;
            this.state.puck.vy = 0;
            this.attackplayer = null;
            this.lastScorer = null;
            this.state.phase = GAMEPHASE.playing;                 
        }   

    }

    playingStep(deltaTime) {
        this.state.time += deltaTime;
        this.movingStep(deltaTime);

        if (this.isTimeOut()) {
            this.state.phase = GAMEPHASE.timeout;
        }
    }

    goalStep(deltaTime) {
        if(!hasPuckReachEndOfGoal(this.state.puck, this.settings)) return this.MovingStepNoCollision(deltaTime);
        this.MovePaddles();
        if (this.suspendedAnimation === null) {
            this.suspendedAnimation = 0;
        }else if (this.suspendedAnimation < 3) {
            this.suspendedAnimation += deltaTime;
        } else {
            this.suspendedAnimation = null;
            this.lastScorer = this.state.puck.vx > 0 ?
                                this.state.player1.id
                                : this.state.player2.id
            this.state.phase = GAMEPHASE.faceOff;
        }
    }

    timeoutStep(deltaTime) {
        if (this.suspendedAnimation === null) {
            this.suspendedAnimation = 0;
            return;
        }

        if (this.suspendedAnimation <= 2) {
            this.suspendedAnimation += deltaTime;
            return;
        }

        this.state.phase= GAMEPHASE.break;
        this.running = false;
    }

    movingStep(deltaTime) {
        this.MovePaddles();
        this.state.puck = puckStep(this.state, deltaTime, this.settings);
    }

    MovingStepNoCollision(deltaTime) {
        this.MovePaddles();
        this.state.puck = simplePuckStep(this.state, deltaTime, this.settings.puck.speedCoeff);
    }

    MovePaddles() {
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
    }

    isTimeOut() {
        return (this.state.time >= 20 && this.state.period === 1)
            || (this.state.time >= 40 && this.state.period === 2)
            || (this.state.time >=60 && this.state.player1.goals.length !== this.state.player2.goals.length);
    }

    nextPeriod() {
        this.state.phase = GAMEPHASE.faceOff;
        this.state.period +=1;
        this.running = true;
        requestAnimationFrame(this.loop);
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
        }else if (e.code === 'Space' && this.state.phase === GAMEPHASE.break) {
            this.nextPeriod();
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