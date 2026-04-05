export class AIdecision {
    constructor(isP1, settings, defenseLevel = 50, attackLevel = 50,) {
        this.isP1 = isP1;
                this.settings = settings;
        this.selfPosition = {
            defense: this.normalizeX(isP1 ? settings.player1.defensePos : settings.player2.defensePos),
            attack: this.normalizeX(isP1 ? settings.player1.attackPos : settings.player2.attackPos)
        };
        this.opponentPosition = {
            defense: this.normalizeX(isP1 ? settings.player2.defensePos : settings.player1.defensePos),
            attack: this.normalizeX(isP1 ? settings.player2.attackPos : settings.player1.attackPos)};
    }
    normalizeX(x) {
        return this.isP1 ? x : 100 - x;
    }
    normalizeVx(vx) {
        return this.isP1 ? vx : -vx;
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


}