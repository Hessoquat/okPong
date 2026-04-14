import { GAMEPHASE } from "../../../../core/constants/game/gamePhase";
import { AIdecision } from "../behavior/AIDecision";


export class AIInput{
    constructor(isP1, settings, defenseLevel = 50, attackLevel = 50,) {
        this.defenseLevel = this.normalizeLevel(defenseLevel);
        this.attackLevel = this.normalizeLevel(attackLevel);
        this.state= {up: false, down: false};
        this.isP1 = isP1;
        this.settings = settings;
        this.AIDecision = new AIdecision(isP1, settings, defenseLevel, attackLevel);
    }
    
    normalizeLevel(value) {
        return Math.min(Math.max(value, 0), 100) / 100;
    }

    getState() {
        return this.state;
    }
    
    update(gameState, dt) {

        this.AIDecision.update(gameState, dt);
        

        const paddleTop = this.isP1 
            ? gameState.player1.position
            : gameState.player2.position;
        const paddleBottom = this.isP1 
            ? gameState.player1.position + (this.settings.paddle.height)
            : gameState.player2.position + (this.settings.paddle.height);

        if (gameState.phase === GAMEPHASE.playing) {
            this.playingMove(gameState, dt, paddleTop, paddleBottom);
        }else if (gameState.phase === GAMEPHASE.pause || gameState.phase === GAMEPHASE.timeUp){
            this.standStill();
        }
        if(gameState.phase === GAMEPHASE.goal) {this.standStill()}
    }
   
    playingMove(game, dt, paddleTop, paddleBottom) {
        if (game.puck.y > paddleBottom) {
            this.goDown();
        } else if (game.puck.y < paddleTop) {
            this.goUp();
        }else {
            this.standStill();
        }
    }
    goUp() {
        this.state.up = true;
        this.state.down = false;
    }
    goDown() {
        this.state.up =false;
        this.state.down= true;
    }
    standStill() {
        this.state.up = false;
        this.state.down= false;
    }
}