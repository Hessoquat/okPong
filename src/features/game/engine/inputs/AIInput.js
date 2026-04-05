import { GAMEPHASE } from "../../../../core/constants/game/gamePhase";
import { AIdecision } from "../behavior/AIDecision";


export class AIInput{
    constructor(isP1, settings, defenseLevel = 50, attackLevel = 50,) {
        this.defenseLevel = this.normalizeLevel(defenseLevel);
        this.attackLevel = this.normalizeLevel(attackLevel);
        this.defenseReactionTime = this.setReactionTime(this.defenseLevel);
        this.attackReactionTime = this.setReactionTime(this.attackLevel);
        this.timer = 0;
        this.state= {up: false, down: false};
        this.isP1 = isP1;
        this.maxSpeedReactionPenalty = 0.08;
        this.maxScoreDiffReactionPenalty = 0.08;
        this.settings = settings;
        this.AIDecision = new AIdecision(isP1, settings, defenseLevel, attackLevel);
    }
    
    normalizeLevel(value) {
        return Math.min(Math.max(value, 0), 100) / 100;
    }

    setReactionTime(level) {
        const minReact = 0.1;
        const maxReact = 0.35;
        return maxReact - level * (maxReact - minReact);
    }

    getState() {
        return this.state;
    }
    
    update(gameState, dt) {
        this.timer += dt;
        if (!this.isReactionTimeUp(gameState)) return;

        this.AIDecision.update(gameState);
        
        this.timer = 0;

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

    isReactionTimeUp(gameState) {
        const puckOnMySide = 
            (this.isP1 && gameState.puck.x <= 50) ||
            (!this.isP1 && gameState.puck.x > 50);;

        const reactionTime = puckOnMySide
            ? this.defenseReactionTime
            : this.attackReactionTime;
        return this.timer >= this.dynamicReactionTime(reactionTime, gameState, puckOnMySide);
    }

    dynamicReactionTime(reactionTime, gameState, isDefending) {
        const puckSpeedPenalty = this.computePuckSpeedStress(gameState.puck, isDefending);
        const scoreDiffPenalty = this.computeScoreDiffStress(gameState);
        return  reactionTime + puckSpeedPenalty + scoreDiffPenalty;
    }

    computePuckSpeedStress(puck, isDefending) {
        const puckSpeed = Math.hypot(puck.vx, puck.vy) * puck.speed;
        
        const maxSpeed = this.computeMaxSpeed();
        const minSpeed = this.computeMinSpeed()
        let normalizedPuckSpeed = (puckSpeed - minSpeed) / (maxSpeed - minSpeed);
        normalizedPuckSpeed = Math.max(0, Math.min(1, normalizedPuckSpeed));
        const stressPenalty = this.maxSpeedReactionPenalty * Math.pow(normalizedPuckSpeed, 0.5);
        return isDefending ? stressPenalty * -1 : stressPenalty ;
    }

    computeMaxSpeed() {
        const maxDeflection = Math.max(this.settings.puck.YDeviationCoeff, this.settings.goal.postDeflectionCoeff);
        return Math.hypot(this.settings.puck.defaultSpeed, maxDeflection) * this.settings.puck.maxSpeed;
    }

    computeMinSpeed() {
        return this.settings.puck.defaultSpeed * this.settings.puck.speedCoeff
    }

    computeScoreDiffStress(gameState) {
        const maxDiff= 5;
        const scoreDiff = gameState.player1.goals.length - gameState.player2.goals.length;
        const normalizeScoreDiff= Math.max(-maxDiff, Math.min(scoreDiff, maxDiff))
        if (normalizeScoreDiff === 0) return 0;

        const playerDiff = this.isP1 ? normalizeScoreDiff : -normalizeScoreDiff;
        return this.maxScoreDiffReactionPenalty * (playerDiff / maxDiff);
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