export class PuckEvent {
    constructor(type,) {
        this.type = type;
        this.y = null;
        this.tImpact = null;
        this.isSet= false;
    }
    setData(y, t) {
        this.y = y;
        this.timpact = t;
        this.isSet = true;
    }
}