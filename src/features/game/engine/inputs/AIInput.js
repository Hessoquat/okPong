import { GAMEPHASE } from "../../../../core/constants/game/gamePhase";
import { IA_BEHAVIOR } from "../../../../core/constants/game/IABehavior";
import { isPuckGoingRight, isPuckMovingonX as isPuckMovingOnX } from "../../physics/puck/puck";

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
        this.selfPosition = {
            defense: this.normalizeX(isP1 ? settings.player1.defensePos : settings.player2.defensePos),
            attack: this.normalizeX(isP1 ? settings.player1.attackPos : settings.player2.attackPos)
        };
        this.opponentPosition = {
            defense: this.normalizeX(isP1 ? settings.player2.defensePos : settings.player1.defensePos),
            attack: this.normalizeX(isP1 ? settings.player2.attackPos : settings.player1.attackPos)};
    }
    
    normalizeLevel(value) {
        return Math.min(Math.max(value, 0), 100) / 100;
    }

    normalizeX(x) {
        return this.isP1 ? x : 100 - x;
    }
    normalizeVx(vx) {
        return this.isP1 ? vx : -vx;
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
        const puckOnMySide = this.hasPuckPassedXPosition(gameState.puck, 50);

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

    setBehavior(game, puck) {
        if (game.phase === GAMEPHASE.faceOff) return IA_BEHAVIOR.faceOff;
        if (this.isPuckInDefenseZone(puck) 
            || (!this.isPuckInAttackZone(puck) && this.isPuckGoingTowarMySide(puck)))
            return IA_BEHAVIOR.defense;
        if (this.isPuckInAttackZone(puck)
            || (!this.isPuckInDefenseZone(puck) && !this.isPuckGoingTowarMySide(puck)))
            return IA_BEHAVIOR.attack
    }

    isPuckInDefenseZone(puck) {
        return this.normalizeX(puck.x) <= this.opponentPosition.attack;
    }

    isPuckInAttackZone(puck) {
        return this.normalizeX(puck.x) >= this.selfPosition.attack;
    }

    hasPuckPassedXPosition(puck, x, whileGoingRight = true) {
        const vx = this.normalizeVx(puck.vx);
        if (vx > 0 !== whileGoingRight) return false;
        
        const normalizedPuckX = this.normalizeX(puck.x);
        if (whileGoingRight) return normalizedPuckX <= x;
        return normalizedPuckX >= x;
    }

    isPuckGoingTowarMySide(puck) {
        return this.normalizeVx(puck.vx < 0);
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