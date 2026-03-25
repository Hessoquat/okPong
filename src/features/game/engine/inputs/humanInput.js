export class HumanInput {
    constructor(systemInput, keymap) {
        this.systemInput= systemInput;
        this.keymap = keymap;
    }

    update(gameState, dt, settings) {}

    getState() {
        const snapshot = this.systemInput.getSnapshot();
        return {
            up: !!snapshot[this.keymap.up],
            down: !!snapshot[this.keymap.down]
        }
    }

}