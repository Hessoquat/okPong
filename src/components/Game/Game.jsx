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

    if (!gameState) return <h1>loading</h1>;
    return(
        <>
        {Math.floor(gameState.time)}
        <Field 
            player1Postion={gameState.player1.position}
            player2Position={gameState.player2.position}
            puck={gameState.puck}
            settings={settings} />
        </>
        );
} 

export default Game;