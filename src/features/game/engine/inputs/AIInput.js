import { GAMEPHASE } from "../../../../constants/game/gamePhase";

export class AIInput{
    constructor(isP1, difficulty = 50) {
        this.difficulty = difficulty;
        this.timer = 0;
        this.state= {up: false, down: false};
        this.isP1 = isP1;
    }
    
    update(gameState, dt, settings) {
        const paddleTop = this.isP1 
            ? gameState.player1.position
            : gameState.player2.position;
        const paddleBottom = this.isP1 
            ? gameState.player1.position + (settings.paddle.height)
            : gameState.player2.position + (settings.paddle.height);

        if (gameState.phase === GAMEPHASE.playing) {
            this.playingMove(gameState, dt, paddleTop, paddleBottom);
        }else if (gameState.phase === GAMEPHASE.pause || GAMEPHASE.timeUp){
            this.standStill();
        }
    }

    getState() {
        return this.state;
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
    goUp() {this.state= this.state= {up: true, down: false}}
    goDown() {this.state= {up: false, down: true}}
    standStill() {this.State= {up: false, down: false}}
}