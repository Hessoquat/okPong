import { GAMEPHASE } from "../../../../constants/game/gamePhase";

export class AIInput{
    constructor(isP1, defenseLevel = 50, attackLevel = 50) {
        this.defenseLevel = this.normalizeLevel(defenseLevel);
        this.attackLevel = this.normalizeLevel(attackLevel);
        this.defenseReactionTime = this.setReactionTime(this.defenseLevel);
        this.attackReactionTime = this.setReactionTime(this.attackLevel);
        this.timer = 0;
        this.state= {up: false, down: false};
        this.isP1 = isP1;
    }
      normalizeLevel(value) {
        return Math.min(Math.max(value, 0), 100) / 100;
    }

    setReactionTime(level) {
        const minReact = 0.00;
        const maxReact = 0.35;
        return maxReact - level * (maxReact - minReact);
    }

    getState() {
        return this.state;
    }
    
    update(gameState, dt, settings) {
        this.timer += dt;
        if (!this.isReactionTimeUp(gameState)) return;
        
        this.timer = 0;

        const paddleTop = this.isP1 
            ? gameState.player1.position
            : gameState.player2.position;
        const paddleBottom = this.isP1 
            ? gameState.player1.position + (settings.paddle.height)
            : gameState.player2.position + (settings.paddle.height);

        if (gameState.phase === GAMEPHASE.playing) {
            this.playingMove(gameState, dt, paddleTop, paddleBottom);
        }else if (gameState.phase === GAMEPHASE.pause || gameState.phase === GAMEPHASE.timeUp){
            this.standStill();
        }
        if(gameState.phase === GAMEPHASE.goal) {this.standStill()}
    }

    isReactionTimeUp(gameState) {
    const puckOnMySide =
        (this.isP1 && gameState.puck.x <= 50) ||
        (!this.isP1 && gameState.puck.x > 50);

    const reactionTime = puckOnMySide
        ? this.defenseReactionTime
        : this.attackReactionTime;

    return this.timer >= reactionTime;
    }

    dynamiqueDefenseReactionTime(gameState, settings) {
        puckSpeedPenalty = this.computePuckSpeedPenalty(gameState.puck, settings);
    }

    computePuckSpeedPenalty(puck, settings) {
        const puckSpeed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
        
        const maxSpeed = this.computeMaxSpeed(puck, settings);
        const normalizedPuckSpeed = (puckSpeed - 1) / (maxSpeed - 1);
    }

    computeMaxSpeed(puck, settings) {
        const maxDeflection = Math.max(settings.puck.YDeviationCoeff, settings.goal.postDeflectionCoeff);
        return Math.sqrt(settings.puck.defaultSpeed * settings.puck.defaultSpeed + maxDeflection * maxDeflection);
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
        this.state.down = false
    }
    goDown() {
        this.state.up =false;
        this.state.down= true
    }
    standStill() {
        this.state.up = false;
        this.state.down= false;
    }
}