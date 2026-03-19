import { useEffect, useRef, useState } from "react";
import { settings } from "../../features/game/config/gameSettings";
import { Engine } from "../../features/game/engine/engine";
import Field from "./Field";

function Game() {
    const engineRef= useRef();
    const [gameState, setGameState] = useState(null);

    useEffect(()=> {
        const engine = new Engine(settings, (state) => setGameState({...state}));
        engineRef.current = engine;
        engine.start();

        return() => engine.stop();
    }, [])

    if (!gameState) return <h1>Hi !!!</h1>;

    return Field(gameState.player1.position, gameState.player2.position, gameState.puck, settings);
} 

export default Game;