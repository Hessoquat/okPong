function ScoreBoard({p1Score, p2Score, time, period}) {

    return(
        <div className="scoreBoard">
            <div className="teamContainer">
                <p className="teamName">joueur 1</p>
                <p className="playerScore">{p1Score}</p>
            </div>
            <div className="timeBox">
                <p className="time">{Math.floor(time)}</p>
                <p className="period">{period}</p>
            </div>
            <div className="teamContainer">
                <p className="teamName">joueur 2</p>
                <p className="playerScore">{p2Score}</p>
            </div>
        </div>
    )
}

export default ScoreBoard;