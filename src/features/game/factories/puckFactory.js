export function initPuck(settings) {
    return {
            x: 50,
            y: 0 + (settings.puck.size / 2),
            vx: 0,
            vy: settings.puck.defaultSpeed,
            size: settings.puck.size
                }
}