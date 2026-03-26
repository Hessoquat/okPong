import { GAMEPHASE } from "../../../constants/game/gamePhase";
import { initPuck } from "../factories/puckFactory";
import { paddleStep } from "../physics/paddle/paddle";
import { hasPuckReachEndOfGoal, puckStep, simplePuckStep } from "../physics/puck/puck";
import { InputManager } from "./inputs/inputManager";

export class Engine {
    constructor(settings, onUpdate, inputManager) {
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
        this.inputs = inputManager;
        this.running = false;
        this.lastTime = null;
        this.firstAttacker = this.state.player1.id;
        this.attackplayer= null;
        this.suspendedAnimation = null;
        this.lastScorer = null;
        this.lastPhase = null;

        this.loop = this.loop.bind(this);
        this.nextPeriod = this.nextPeriod.bind(this);
    }

    start() {
        if(this.running) return;

        this.running = true;
        this.lastTime = null;
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.running= false;
        this.inputs.systemInput.destroy();
    }

    loop(time) {

        if (!this.running) return;

        if (this.lastTime === null) this.lastTime = time;
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        this.inputs.update(this.getSnapshot(), deltaTime, this.settings);
        this.step(deltaTime);
        this.onUpdate(this.getSnapshot());
        requestAnimationFrame(this.loop);
    }

    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    step(deltaTime) {
        if (this.inputs.getPausePressed()) this.onSpacePress();
        
        if (this.state.phase === GAMEPHASE.pause 
            || this.state.phase === GAMEPHASE.intermission) return;

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
            case GAMEPHASE.timeUp:
                this.timeUpStep(deltaTime);
        }
    }

    faceOffStep(deltaTime) {
        if (!this.attackplayer) {
            const players = [
                    this.state.player1,
                    this.state.player2
                ];
                console.log(this.state.period % 2)
            const targetId = this.lastScorer ?? (this.state.period % 2 !== 0 ? this.firstAttacker : [this.state.player1.id, this.state.player2.id].find(id => id !== this.firstAttacker));
            this.attackplayer = players.find(player => player.id === targetId);
        }

        if (this.state.puck.vx !== 0) {
            this.state.puck = initPuck(this.settings);
        }

        this.MovingStepNoCollision(deltaTime);
                
        if ((this.state.puck.y + (0.5 * this.state.puck.size)) >= (this.attackplayer.position + (0.5 * this.settings.paddle.height))) {
            
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

        if (this.isTimeUp()) {
            this.state.phase = GAMEPHASE.timeUp;
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

    timeUpStep(deltaTime) {
        if (this.suspendedAnimation === null) {
            this.suspendedAnimation = 0;
            return;
        }

        if (this.suspendedAnimation <= 2) {
            this.suspendedAnimation += deltaTime;
            return;
        }

        this.state.phase= GAMEPHASE.intermission;
        this.lastTime = null;
        this.state.player1.position = 50 - (0.5 * this.settings.paddle.height);
        this.state.player2.position = 50 - (0.5 * this.settings.paddle.height);
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
        const {player1, player2} = this.inputs.getPlayers();

        this.state.player1.position = paddleStep(
            this.state.player1.position, 
            player1.up,
            player1.down,
            this.settings
        );
        this.state.player2.position = paddleStep(
            this.state.player2.position, 
            player2.up,
            player2.down,
            this.settings
        );
    }

    isTimeUp() {
        return (this.state.time >= (this.settings.time.periodLength * this.state.period)
        && !(this.state.period === this.settings.time.nbPeriods
            && this.state.player1.goals.length === this.state.player2.goals.length));
    }

    nextPeriod() {
        if (this.state.phase !== GAMEPHASE.intermission) return;
        this.state.phase = GAMEPHASE.faceOff;
        this.state.period +=1;
        this.running = true;
        requestAnimationFrame(this.loop);
    }

    onSpacePress() {
        if (this.state.phase === GAMEPHASE.goal || this.state.phase === GAMEPHASE.timeUp) return;
        if (this.state.phase === GAMEPHASE.intermission) {
            this.nextPeriod();
            return;
        };
        if (this.state.phase !== GAMEPHASE.pause) {
            this.lastPhase = this.state.phase;
            this.state.phase = GAMEPHASE.pause;
            return;
        }
        
        if(this.lastPhase){
            this.state.phase = this.lastPhase;
            this.lastPhase = null;
        }
    }
}