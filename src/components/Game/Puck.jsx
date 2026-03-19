import { useEffect, useState } from "react";

function Puck({puck}) {
    return <div className='puck' style={{top: `${puck.y}%`, left: `${puck.x}%`}} />
}

export default Puck;