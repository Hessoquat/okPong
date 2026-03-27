import { GAMEMODE } from "../../../constants/game/gameMode";

export const settings= {
    mode: GAMEMODE.solo,
    player1: {
        defensePos: 8,
        attackPos: 78
    },
    player2: {
        defensePos: 92,
        attackPos: 23
    },
    paddle : {
        height: 14,
        width: 1.3,
        speed: 1.5
    },
    puck: {
        defaultSpeed: 1,
        YDeviationCoeff: 1.4,
        size: 1,
        speedCoeff: 60,
        maxSpeed: 80
    },
    goal: {
        size: 30,
        depth: 2,
        postWidth: 1,
        postDeflectionCoeff: 1,
        backGap: 0
    },
    time: {
        nbPeriods: 3,
        periodLength: 20
    }
}