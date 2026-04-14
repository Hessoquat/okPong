import { GAMEPHASE } from "../../../../core/constants/game/gamePhase";
import { IA_BEHAVIOR } from "./constants/IABehavior";
import { simplePuckStep } from "../../physics/puck/puck";
import { PADDLE_MOVEMENT } from "./constants/paddleMovement";
import { TRAJECTORY_TYPE } from "./constants/trajectoryType";
import { PuckEvent } from "./types/puckEvent";
import { PUCK_EVENT_TYPE } from "./constants/PuckEventType";
import { IASkillsModel } from "../skills/IASkillsModel";

export class AIdecision {
    
    constructor(isP1, settings, defenseLevel = 50, attackLevel = 50,) {
        this.isP1 = isP1;
        this.settings = settings;
        this.level = {attack: attackLevel, defense: defenseLevel},
        this.skillsModel = new IASkillsModel({attack: attackLevel, defense: defenseLevel}); 
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
        this.timer = 0;

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
    
    isReactionTimeUp(gameState) {
        return this.timer >= this.dynamicReactionTime(gameState);
    }

    dynamicReactionTime(gameState) {
        const reactionTime = this.skillsModel.getReactionTime(this.gamePerception.currentBehavior);
        const puckSpeedPenalty = this.computePuckSpeedStress(this.gamePerception.puck);
        const scoreDiffPenalty = this.computeScoreDiffStress(gameState);
        return reactionTime + puckSpeedPenalty + scoreDiffPenalty;
    }
    
    computePuckSpeedStress(puck) {
        const puckSpeed = Math.hypot(puck.vx, puck.vy) * puck.speed;
        
        const maxSpeed = this.computeMaxSpeed();
        const minSpeed = this.computeMinSpeed()
        let normalizedPuckSpeed = (puckSpeed - minSpeed) / (maxSpeed - minSpeed);
        normalizedPuckSpeed = Math.max(0, Math.min(1, normalizedPuckSpeed));
        const stressPenalty = this.skillsModel.puckSpeedSensitivity * Math.pow(normalizedPuckSpeed, 0.5);
        return this.gamePerception.currentBehavior === IA_BEHAVIOR.defense ? stressPenalty * -1 : stressPenalty ;
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
        const scoreDiff = gameState.self.goals.length - gameState.opponent.goals.length;
        const normalizeScoreDiff= Math.max(-maxDiff, Math.min(scoreDiff, maxDiff))
        if (normalizeScoreDiff === 0) return 0;

        return this.skillsModel.scoreDiffSensitivity * (scoreDiff / maxDiff);
    }

    update(gameState, dt) {
        const normalizedState = this.normalizeGameState(gameState);
        this.timer += dt;
        if (!this.isReactionTimeUp(normalizedState)) return;

        this.timer = 0;

        this.gamePerception = {
            currentBehavior : this.inferBehaviorMode(normalizedState),
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

    inferBehaviorMode(normalizedGame) {
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

    buildGameSituationModel(gamePhase, normalizedPuck, targets, time) {
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

        const inferedEvents = this.computePuckTrajectoryEvents(gamePhase, normalizedPuck, targets, time);
        anticipations.selfCrossing = this.buildSelfCrossingPerception(inferedEvents, normalizedPuck);
        anticipations.goalThreat = this.computeTrajectoryType(inferedEvents.atGoal.y);

        return anticipations;
    }

    computePuckTrajectoryEvents(gamePhase, normalizedPuck, targets, time) {
         const predictedTargets= {
            atSelfPaddle: new PuckEvent(PUCK_EVENT_TYPE.selfCrossing),
            atOpponentPaddle: new PuckEvent(PUCK_EVENT_TYPE.opponentCrossing),
            atGoal: new PuckEvent(PUCK_EVENT_TYPE.gloalLineCrossing)
        };
        if (gamePhase !== GAMEPHASE.playing) {
            return predictedTargets;
        }
        
        let projectedPuck = {...normalizedPuck}
       
        let iteration = 0;
        while (
            (this.isPuckGoingTowardMySide(normalizedPuck) ? projectedPuck.x > targets.goal : projectedPuck.x < targets.goal)
             && iteration < 1000) {
            iteration++
            projectedPuck = simplePuckStep({puck: projectedPuck}, this.stepTime);
            if (!predictedTargets.atSelfPaddle.isSet
                && this.hasPuckreachedTarget(projectedPuck, targets.self)){
                    predictedTargets.atSelfPaddle.setData(projectedPuck.y,  this.copmputeProjectedTime(time, iteration));
                }
            if (!predictedTargets.atOpponentPaddle.isSet && this.hasPuckreachedTarget(projectedPuck, targets.opponent)) {
                predictedTargets.atOpponentPaddle.setData(projectedPuck.y,  this.copmputeProjectedTime(time, iteration));
            }
            if (!predictedTargets.atGoal.isSet && this.hasPuckreachedTarget(projectedPuck, targets.goal)) {
                predictedTargets.atGoal.setData(projectedPuck.y, this.copmputeProjectedTime(time, iteration));
            }
        }

        return predictedTargets;
    }

    copmputeProjectedTime(time, iteration) {
        return time + iteration * this.stepTime
    }

    computeTrajectoryType(puckPositionAtGoal) {
        puckPositionAtGoal >= this.goalSurfaceCoverage.top && puckPositionAtGoal <= this.goalSurfaceCoverage.bottom
                        ? TRAJECTORY_TYPE.dangerous 
                        : TRAJECTORY_TYPE.safe;
    }

    buildSelfCrossingPerception(inferedEvent, currentPuck) {
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
        const baseError = 1 - (level / 100);
        selfCrossing.yMin = inferedEvent.atSelfPaddle.y - (5 * baseError);
        selfCrossing.yMax = inferedEvent.atSelfPaddle.y + (5 * baseError);

        return selfCrossing;
    }

}