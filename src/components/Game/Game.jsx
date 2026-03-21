import { useEffect, useRef, useState } from "react";
import { settings } from "../../features/game/config/gameSettings";
import { Engine } from "../../features/game/engine/engine";
import Field from "./Field";
import ScoreBoard from "./scoreBoard";
import "../../assets/style/scoreBoard.css";
import '../../assets/style/field.css';
import '../../assets/style/gameScreen.css';

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
        <div className="gameContainer">
        <ScoreBoard 
            p1Score={gameState.player1.score} 
            p2Score={gameState.player2.score}
            time={gameState.time}
            period={gameState.period}
        />
        <Field 
            player1Position={gameState.player1.position}
            player2Position={gameState.player2.position}
            puck={gameState.puck}
            settings={settings} />
        </div>
        );
} 

export default Game;