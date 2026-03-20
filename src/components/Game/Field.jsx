import { useEffect, useRef, useState } from 'react';
import '../../assets/style/field.css'
import Paddle from './Paddle';
import Puck from './Puck';
import Goal from './Goal';

function Field({player1Position, player2Position, puck, settings}) {
    
    return(
        <div className='field' >
            <Goal className="goal1" size={settings.goal.size} depth={settings.goal.depth} postWidth={settings.goal.postWidth} />
            <Goal className="goal2" size={settings.goal.size} depth={settings.goal.depth} postWidth={settings.goal.postWidth} />
            <Puck puck={puck} />
            <Paddle player="player1" position={player1Position} paddleSettings={settings.paddle} xPosition={settings.player1.defensePos} />
            <Paddle player='player2' position={player2Position} paddleSettings={settings.paddle} xPosition={settings.player2.attackPos} />
            <Paddle player="player1" position={player1Position} paddleSettings={settings.paddle} xPosition={settings.player1.attackPos} />
            <Paddle player='player2' position={player2Position} paddleSettings={settings.paddle} xPosition={settings.player2.defensePos} />
        </div>
        
    );
}

export default Field;