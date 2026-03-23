export class AIInput{
    constructor(difficulty = 50) {
        this.difficulty = difficulty;
        this.timer = 0;
        this.state= {up: false, down: false};
    }
    
    getState() {
        return this.state;
    }
}