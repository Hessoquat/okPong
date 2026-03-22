import { HumanInput } from "./humanInput";

export class PlayersInputs {
    constructor(onSpace) {
        this.Player1Input = new HumanInput(true);
        this.player2Input = new HumanInput(false);

        this.handleSpaceDown = this.handleSpaceDown.bind(this);
        this.setListeners();
        this.onSpace = onSpace;
    }

    setListeners(callback) {
        document.addEventListener('keydown', this.handleSpaceDown);
    }

    removeListeners() {
        this.Player1Input.unsetEventHandler();
        this.player2Input.unsetEventHandler();
        document.removeEventListener('keydown', this.handleSpaceDown);
    }

    handleSpaceDown(e) {
        if (e.code === 'Space') this.onSpace();
    }

    getplayersInput() {
        return {
            player1: this.Player1Input.inputs,
            player2: this.player2Input.inputs,
        }
    }
}