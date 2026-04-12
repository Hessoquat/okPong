import { GAMEPHASE } from "../../../../core/constants/game/gamePhase";
import { IA_BEHAVIOR } from "./constants/IABehavior";
import { simplePuckStep } from "../../physics/puck/puck";
import { PADDLE_MOVEMENT } from "./constants/paddleMovement";
import { TRAJECTORY_TYPE } from "./constants/trajectoryType";

export class AIdecision {
    
    constructor(isP1, settings, defenseLevel = 50, attackLevel = 50,) {
        this.isP1 = isP1;
                this.settings = settings;
                this.level = {attack: attackLevel, defense: defenseLevel}, 
        this.selfXPosition = {
            defense: this.normalizeX(isP1 ? settings.player1.defensePos : settings.player2.defensePos),
            attack: this.normalizeX(isP1 ? settings.player1.attackPos : settings.player2.attackPos)
        };
        this.opponentXPosition = {
            defense: this.normalizeX(isP1 ? settings.player2.defensePos : settings.player1.defensePos),
            attack: this.normalizeX(isP1 ? settings.player2.attackPos : settings.player1.attackPos)};
        this.gamePerception = {
            currentBehavior: null,
            opponentYPostion: null,
            opponentMovement: null,
            puck: {
                x: null,
                y: null,
                vx: null,
                vy: null,
                size: null,
                speed: null,
            },
            puckAnticipation: {
                selfCrossing:  {
                    yMin: null,
                    yMax: null,
                    tMin: null,
                    tMax: null,
                    certainty: null
                },
                opponentInterception: {
                    possible: null,
                    influenceRange: null
                },
                goalThreat: {
                    isOnTarget: TRAJECTORY_TYPE.uncertain,
                }
            }
        }
        this.stepTime = 0.16;
        this.goalSurfaceCoverage = {
            top: 50 - (settings.goal.size / 2),
            bottom: 50 + (settings.goal.size / 2)
        }
        this.prevOpponentYPos = null;

    }

    normalizeX(x) {
        return this.isP1 ? x : 100 - x;
    }
    normalizeVx(vx) {
        return this.isP1 ? vx : -vx;
    }

    normalizeGameState(gameState) {
        return {
            phase: gameState.phase,
            period: gameState.period,
            time: gameState.time,
            self: this.isP1 ? gameState.player1 : gameState.player2,
            opponent: this.isP1 ? gameState.player2 : gameState.player1,
            puck: {
                x: this.normalizeX(gameState.puck.x),
                y: gameState.puck.y,
                vx: this.normalizeVx(gameState.puck.vx),
                vy: gameState.puck.vy,
                size: gameState.puck.size,
                speed: gameState.puck.speed
            }
        }
    }

    update(gameState) {
        const normalizedState = this.normalizeGameState(gameState);

        this.gamePerception = {
            currentBehavior : this.inferBehaiorMode(normalizedState),
            opponentYPostion: normalizedState.opponent.position,
            opponentMovement: this.analyzeOpponentMovement(normalizedState.phase, normalizedState.opponent.position),
            puck: normalizedState.puck,
        };

        if (normalizedState.phase === GAMEPHASE.playing) {
            const targets = this.gamePerception.currentBehavior === IA_BEHAVIOR.defense ? 
                {
                    self: this.selfXPosition.defense,
                    opponent: this.opponentXPosition.attack,
                    goal: this.settings.goal.backGap + this.settings.goal.depth
                }
                : {
                    self: this.selfXPosition.attack,
                    opponent: this.opponentXPosition.attack,
                    goal: 100 - (this.settings.goal.backGap + this.settings.goal.depth)
                };
            
            this.gamePerception.puckAnticipation = this.buildGameSituationModel(normalizedState.phase, normalizedState.puck, targets, gameState.time);
        }
    }

    inferBehaiorMode(normalizedGame) {
        if (normalizedGame.phase === GAMEPHASE.faceOff) return IA_BEHAVIOR.faceOff;
        if (this.isPuckInDefenseZone(normalizedGame.puck) 
            || (!this.isPuckInAttackZone(normalizedGame.puck) && this.isPuckGoingTowardMySide(normalizedGame.puck)))
            return IA_BEHAVIOR.defense;
        if (this.isPuckInAttackZone(normalizedGame.puck)
            || (!this.isPuckInDefenseZone(normalizedGame.puck) && !this.isPuckGoingTowardMySide(normalizedGame.puck)))
            return IA_BEHAVIOR.attack
    }

    isPuckInDefenseZone(normalizedPuck) {
        return normalizedPuck.x <= this.opponentXPosition.attack;
    }

    isPuckInAttackZone(normalizedPuck) {
        return normalizedPuck.x >= this.selfXPosition.attack;
    }

    hasPuckreachedTarget(normalizedPuck, target) {
        return this.isPuckGoingTowardMySide(normalizedPuck) 
            ? normalizedPuck.x <= target
            : normalizedPuck.x >= target
    }

    isPuckGoingTowardMySide(normalizedPuck) {
        return normalizedPuck.vx < 0;
    }

    analyzeOpponentMovement(gamePhase, opponentPos) {

        let movement = PADDLE_MOVEMENT.iddle;

        if (gamePhase !== GAMEPHASE.faceOff && gamePhase !== GAMEPHASE.playing) {
            this.prevOpponentYPos = null;
            return  movement;
        }
        if (!this.prevOpponentYPos) {
            this.prevOpponentYPos = opponentPos;
            movement;
        }
        
        if (this.prevOpponentYPos < opponentPos) {
            movement = PADDLE_MOVEMENT.down;
        } else if (this.prevOpponentYPos > opponentPos) {
            movement = PADDLE_MOVEMENT.up;
        }

        this.prevOpponentYPos = opponentPos
        return movement;
    }

    buildGameSituationModel(gamePhase, normalizedPuck, targets) {
        let anticipations = {
                selfCrossing:  {
                    yMin: null,
                    yMax: null,
                    tMin: null,
                    tMax: null,
                    certainty: null
                },
                opponentInterception: {
                    possible: null,
                    influenceRange: null
                },
                goalThreat: {
                    isOnTarget: TRAJECTORY_TYPE.uncertain,
                }
            };

        const puckPrediction = this.computePuckTrajectoryEvents(gamePhase, normalizedPuck, targets, time);
            console.log(puckPrediction  )
        anticipations.selfCrossing = this.buildSelfCrossingPerception(puckPrediction, normalizedPuck);

        return anticipations;
    }

    computePuckTrajectoryEvents(gamePhase, normalizedPuck, targets, time) {
        if (gamePhase !== GAMEPHASE.playing) {
            return {
                atOpponentPaddleX: {
                    y: null,
                    tImpact: null
                },
                atSelfPaddle:  {
                    y: null,
                    tImpact: null
                },
                trajectoryType: TRAJECTORY_TYPE.uncertain
            };
        }
        
        let projectedPuck = {...normalizedPuck}
        const predictedTargets= {
            atSelfPaddleX: {
                y: null,
                tImpact: null
            },
            atOpponentPaddleX: {
                y: null,
                tImpact: null,
            },
            trajectoryType: TRAJECTORY_TYPE.uncertain
        }
        let iteration = 0;
        while (
            (this.isPuckGoingTowardMySide(normalizedPuck) ? projectedPuck.x > targets.goal : projectedPuck.x < targets.goal)
             && iteration < 1000) {
            iteration++
            projectedPuck = simplePuckStep({puck: projectedPuck}, this.stepTime);
            if (!predictedTargets.atSelfPaddleX.y 
                && this.hasPuckreachedTarget(projectedPuck, targets.self)){
                    predictedTargets.atSelfPaddleX.y = projectedPuck.y;
                    predictedTargets.atSelfPaddleX.tImpact = time + (iteration * this.stepTime);
                }
            if (!predictedTargets.atOpponentPaddleX.y && this.hasPuckreachedTarget(projectedPuck, targets.opponent)) {
                predictedTargets.atOpponentPaddleX.y = projectedPuck.y;
                predictedTargets.atOpponentPaddleX.tImpact = (targets.opponent - normalizedPuck.x) / normalizedPuck.vx;
            }
            if (!predictedTargets.trajectoryType && this.hasPuckreachedTarget(projectedPuck, targets.goal)) {
                predictedTargets.trajectoryType = 
                    projectedPuck.y >= this.goalSurfaceCoverage.top && projectedPuck.y <= this.goalSurfaceCoverage.bottom
                        ? TRAJECTORY_TYPE.dangerous 
                        : TRAJECTORY_TYPE.safe;
            }
        }

        return predictedTargets;
    }

    buildSelfCrossingPerception(puckPrediction, currentPuck) {
        const selfCrossing =  {
                yMin: null,
                yMax: null,
                tMin: null,
                tMax: null,
                certainty: null
            };
            if (this.gamePerception.currentBehavior !== IA_BEHAVIOR.attack 
                && this.gamePerception.currentBehavior !== IA_BEHAVIOR.defense) 
                return selfCrossing;
        const level = this.gamePerception.currentBehavior === IA_BEHAVIOR.attack ? this.level.attack : this.level.defense;
        const selfPaddleX = this.gamePerception.currentBehavior === IA_BEHAVIOR.attack ? this.selfXPosition.attack : this.selfXPosition.defense;
        const baseError = 1 - (level / 100);
        selfCrossing.yMin = puckPrediction.atSelfPaddle - (5 * baseError);
        selfCrossing.yMax = puckPrediction.atSelfPaddle + (5 * baseError);

        return selfCrossing;
    }

}