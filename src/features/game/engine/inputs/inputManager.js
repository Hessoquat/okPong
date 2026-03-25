export class InputManager {
    constructor(systemInput, player1Input, player2Input) {
        this.systemInput = systemInput;
        this.player1 = player1Input;
        this.player2= player2Input;
        this.prev = {};
        this.current = {};
    }

    update(gameState, dt, settings) {
        this.prev = this.current;
        this.current= this.systemInput.getSnapshot();
        this.player1.update(gameState, dt, settings);
        this.player2.update(gameState, dt, settings);
    }

    getPlayer1() {
        return this.player1.getState();
    }

    getPlayer2() {
        return this.player2.getState();
    }
    getPlayers() {
        return {player1: this.getPlayer1(), player2: this.getPlayer2()};
    }

    getPausePressed() {
        return !!this.current.Space && !this.prev.Space;
    }
}