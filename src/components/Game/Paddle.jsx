function Paddle({player, position, paddleSettings, xPosition}) {
    return <div className={`${player} paddle`} style={{
        height: `${paddleSettings.height}%`, 
        width: `${paddleSettings.width}%`,
        top: `${position}%`, 
        left: `${xPosition}%`}}
        ></div>
}
export default Paddle;