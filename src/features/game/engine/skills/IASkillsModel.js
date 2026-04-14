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


    setPuckSpeedSensitivity(level) {
        const baseSensitivity = 0.05;
        return {
            attack: baseSensitivity + this.normalizedhundredth(level.attack),
            defense: baseSensitivity +  this.normalizedhundredth(level.defense)
        }
    }
    setScoreDiffSensitivity(averageLevel) {
        const baseSensitivity = 0.05
        const normalizedLevel = this.normalizedhundredth(averageLevel);
        return baseSensitivity + normalizedLevel;
    }

    normalizedhundredth(level) {
        return (1 - level / 100)
    }

}