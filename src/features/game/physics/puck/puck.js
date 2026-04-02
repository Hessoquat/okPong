import { GAMEPHASE } from "../../../../core/constants/game/gamePhase";

const makeRect = (left, top, width, height) => ({
    left,
    right: left + width,
    top,
    bottom: top + height
});

const makeGoalRect = (settings, isLeftGoal) => {
    return makeRect( isLeftGoal ? settings.goal.backGap : 100 - settings.goal.backGap - settings.goal.depth,
                    50 - (settings.goal.size / 2) + settings.goal.postWidth,
                    settings.goal.depth, 
                    settings.goal.size - settings.goal.postWidth)
} 
const makePuckRectangle = (puckData) => {
    const puck = makeRect(puckData.x, puckData.y, puckData.size, puckData.size);
    puck.center = puckData.y + puckData.size / 2;
    puck.isGoingRight =  isPuckGoingRight(puckData);
    return puck;
}

const intersection= (rectA, rectB) => rectA.right >= rectB.left 
                                && rectA.left <= rectB.right
                                && rectA.top <= rectB.bottom
                                && rectA.bottom >= rectB.top;
const contains = (outer, inner) => inner.left >= outer.left
                                && inner.right <= outer.right
                                && inner.top >= outer.top
                                && inner.bottom <= outer.bottom;

export const isPuckMovingonX = (puck) => puck.vx !== 0;
export const isPuckGoingRight = (puck) => puck.vx > 0;

export const hasPuckReachEndOfGoal = (puck, settings) => {
    const puckRect = makePuckRectangle(puck);
    const leftGoal = makeGoalRect(settings, true);
    const rightGoal = makeGoalRect(settings, false);

    const reachedLeftend = puckRect.left <= leftGoal.left
                    || puckRect.top <= leftGoal.top
                    || puckRect.bottom >= leftGoal.bottom;

    
 
    const reachRightEnd = puckRect.right >= rightGoal.right
                    || puckRect.top <= rightGoal.top
                    || puckRect.bottom >= rightGoal.bottom;

    return reachRightEnd || reachedLeftend;
}
                             
const step = (puck, deltaTime) => ({
    ...puck,
    x: puck.x + puck.vx  * deltaTime * puck.speed ,
    y: puck.y + puck.vy  * deltaTime * puck.speed
});

export const puckStep = (game, deltaTime, settings) => {
    let nextPuck = game.puck;
    const player1 = game.player1.position;
    const player2 = game.player2.position;

    const goalLeft = makeGoalRect(settings, true);
    const goalRight = makeGoalRect(settings, false);
    
    nextPuck = step(nextPuck, deltaTime);
    nextPuck = handleCollision(nextPuck, player1, player2, settings);
    handleGoal(makePuckRectangle(nextPuck), goalLeft, goalRight, game);

    return nextPuck;
}

export const simplePuckStep = (game, deltaTime) => handleBorderCollision(
    step(game.puck, deltaTime)
);

const handleCollision = (nextPuck, player1, player2, settings) => {
    const puckRect = makePuckRectangle(nextPuck);
    nextPuck = handlePaddleCollision(player1, player2, nextPuck, puckRect, settings);
    nextPuck = handleGoalCollision(nextPuck, puckRect, settings);
    nextPuck = handleBorderCollision(nextPuck);
    return nextPuck;
};


const handleBorderCollision =(nextPuck) => {
    let {x, y , vx, vy, size, speed} = nextPuck;
    if (y <= 0) {
            y = 0;
            vy *= -1;
        } else if (y + size >= 100) {
            y = 100 - size;
            vy *= -1;
        }

        if (x <= 0) {
            x = 0;
            vx *= -1;
        } else if (x + size >= 100) {
            x = 100 - size;
            vx *= -1;
    }
    return {x, y, vx, vy, size, speed}
}

const handlePaddleCollision = (player1top, player2top, nextPuck, puckRect, settings) => {
    const player1Defense = makeRect(
        settings.player1.defensePos, 
        player1top, 
        settings.paddle.width, 
        settings.paddle.height);

    const player1Attack = makeRect(
        settings.player1.attackPos,
        player1top,
        settings.paddle.width,
        settings.paddle.height
    );

    const hasHitPlayer1X = intersection(player1Defense, puckRect) || intersection(player1Attack, puckRect);

    if (hasHitPlayer1X) {       
   
        nextPuck.vx = puckRect.isGoingRight ? nextPuck.vx : nextPuck.vx * -1;
        nextPuck.vy= YDeflection(player1Attack, puckRect, settings.puck.YDeviationCoeff);

        return nextPuck;
    }
                
    const player2Defense = makeRect(
        settings.player2.defensePos,
        player2top,
        settings.paddle.width,
        settings.paddle.height
    );

    const player2Attack = makeRect(
        settings.player2.attackPos,
        player2top,
        settings.paddle.width,
        settings.paddle.height
    )

    const hasHitPlayer2X = intersection(player2Defense, puckRect) || intersection(player2Attack, puckRect);

    if (hasHitPlayer2X) {
        nextPuck.vx = puckRect.isGoingRight ? nextPuck.vx * -1: nextPuck.vx;
        nextPuck.vy= YDeflection(player2Attack, puckRect, settings.puck.YDeviationCoeff);
        return nextPuck;
    }
    return nextPuck;
}

const handleGoalCollision = (nextPuck, puckRect, settings) => {
    const goalTop = 50 - settings.goal.size / 2;
    const goalBottom = 50 + settings.goal.size / 2;

    const leftGoal = {
        upperPost: {
            left: settings.goal.backGap,
            right: settings.goal.backGap + settings.goal.depth,
            top: goalTop,
            bottom: goalTop + settings.goal.postWidth,
        },
        lowerPost: {
            left: settings.goal.backGap,
            right: settings.goal.backGap + settings.goal.depth,
            top: goalBottom - settings.goal.postWidth,
            bottom: goalBottom,
        }
    }

    const rightGoal = {
        upperPost: {
            left:  100 - (settings.goal.depth + settings.goal.backGap),
            right: 100- settings.goal.backGap,
            top: goalTop,
            bottom: goalTop + settings.goal.postWidth,
        },
        lowerPost: {
            left:  100 - (settings.goal.depth + settings.goal.backGap),
            right: 100- settings.goal.backGap,
            top: goalBottom - settings.goal.postWidth,
            bottom: goalBottom,
        }
    }

    const posts = [
        leftGoal.upperPost,
        leftGoal.lowerPost,
        rightGoal.upperPost,
        rightGoal.lowerPost
    ]

   for (const post of posts) {
        if (!intersection(post, puckRect)) continue;

        if(isXAxisCollision(post, puckRect)) {
            nextPuck.vx *= -1;
            nextPuck.vy = YDeflection(post, puckRect, settings.goal.postDeflectionCoeff);
        }else {
            nextPuck.vy *= -1; 
        }
         return nextPuck;
    }
    return nextPuck;
}

const isXAxisCollision = (post, puck) => {
    const overlapLeft = puck.right - post.left;
    const overlapRight = post.right - puck.left;
    const overlapTop = puck.bottom - post.top;
    const overlapBottom = post.bottom - puck.top;
    
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapBottom, overlapTop);
    return minOverlapX < minOverlapY;
}
const YDeflection = (collidedRect, puck, deflectionCoeff) => {
    const collidedRectCenter = (collidedRect.top + collidedRect.bottom)/2;
    const halfHeight = (collidedRect.bottom - collidedRect.top)/2;
    let impact = (puck.center - collidedRectCenter)/halfHeight;
    impact = Math.max(-1, Math.min(1, impact));
    impact=  Math.sign(impact) * Math.pow(Math.abs(impact), 1.25);
    return impact * deflectionCoeff;
}

const handleGoal = (puckRect, goalLeft, goalRight, game) => {   
    if (contains(goalLeft, puckRect)) {
        game.player2.goals.push(game.time);
        game.phase = GAMEPHASE.goal;
    }else if (contains(goalRight, puckRect)) {
        game.player1.goals.push(game.time);
        game.phase = GAMEPHASE.goal;
    }
}