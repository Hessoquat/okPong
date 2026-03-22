export class HumanInput {
    constructor(isPlayer1) {
        this.inputs = {up: false, down: false}
        this.isPlayer1 = isPlayer1;
        this.keyMap = isPlayer1
            ? { KeyW: 'up', KeyS: 'down' }
            : { ArrowUp: 'up', ArrowDown: 'down' };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.initEventListener();
    }

    initEventListener() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    unsetEventHandler() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    handleKey(code, isPressed) {
        const action = this.keyMap[code];
        if (action) this.inputs[action] = isPressed;
    }

    handleKeyDown(e) {
        this.handleKey(e.code, true);
    }

    handleKeyUp(e) {
        this.handleKey(e.code, false);
    }
}