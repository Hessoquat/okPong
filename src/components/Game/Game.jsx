import { useEffect, useRef, useState } from "react";
import { settings } from "../../features/game/config/gameSettings";
import { Engine } from "../../features/game/engine/engine";
import Field from "./Field";
import ScoreBoard from "./scoreBoard";
import "../../assets/style/scoreBoard.css";
import '../../assets/style/field.css';
import '../../assets/style/gameScreen.css';
import { GAMEPHASE } from "../../constants/game/gamePhase";
import Intermission from "./Intermission";
import { SystemInput } from "../../features/game/engine/inputs/systemInput";
import { EngineFactory } from "../../features/game/factories/engineFactory";
import { GAMEMODE } from "../../constants/game/gameMode";


function Game() {
    const engineRef= useRef();
    const [gameState, setGameState] = useState(null);

    useEffect(()=> {
        const engine = EngineFactory.createEngine(
            settings, 
            (state) => setGameState({...state}),
            GAMEMODE.computerVsPlayer,
            {defense: 40, attack: 65}
        );
        engineRef.current = engine;
        engine.start();

        return () => engine.stop();
    }, [])

    if (!gameState) return <h1>loading</h1>;
    if (gameState.phase === GAMEPHASE.intermission) 
        return <Intermission 
            player1={gameState.player1} 
            player2={gameState.player2} 
            period={gameState.period}
            onNext={engineRef.current.nextPeriod}
            settings= {settings}
            />;

    return(
        <div className="gameContainer">
            <ScoreBoard 
                p1Score={gameState.player1.goals.length} 
                p2Score={gameState.player2.goals.length}
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