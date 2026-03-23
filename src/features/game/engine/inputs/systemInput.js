export class SystemInput {
    constructor() {
        this.keys = Object.create(null);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.init();
    }

    init() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
    }
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    getSnapshot() {
        return {...this.keys};
    }
}