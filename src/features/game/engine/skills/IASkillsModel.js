import { IA_BEHAVIOR } from "../behavior/constants/IABehavior";

export class IASkillsModel{
    constructeur(level) {
        const averageLevel = (level.attack + level.defense) / 2;
        this.reactionTime = this.setReactionTime(level);
        this.puckSpeedSensitivity = this.setPuckSpeedSensitivity(level);
        this.scoreDiffSensitivity = this.setScoreDiffSensitivity(averageLevel);
    }

    setReactionTime(level) {
        const minReact = 0.1;
        const maxReact = 0.35;
        return {
            attack: maxReact - level.attack * (maxReact - minReact),
            defense: maxReact - level.defense * (maxReact - minReact)
        };
    };

    getReactionTime(currentBehavior) {
        if (currentBehavior !== IA_BEHAVIOR.attack && currentBehavior !== IA_BEHAVIOR.defense) return false;
        return currentBehavior === IA_BEHAVIOR.attack ? this.reactionTime.attack : this.reactionTime.defense;
    }

    setPuckSpeedSensitivity(level) {
        const baseSensitivity = 0.05;
        return {
            attack: baseSensitivity + this.normalizedthousandth(level.attack),
            defense: baseSensitivity +  this.normalizedthousandth(level.defense)
        }
    }
    setScoreDiffSensitivity(averageLevel) {
        const baseSensitivity = 0.03
        const normalizedLevel = this.normalizedthousandth(averageLevel);
        return baseSensitivity + normalizedLevel;
    }

    normalizedthousandth(level) {
        return (0.1 - averageLevel / 1000)
    }

}