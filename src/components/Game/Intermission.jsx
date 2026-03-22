import '../../assets/style/intermission.css'
function Intermission   ({player1, player2, period}) {
    const filterGoalByPeriod = 
        (player, lowerTimeLimit, upperTimeLimit) => player.goals.filter(
            (goal) => goal >= lowerTimeLimit && goal < upperTimeLimit
        ); 

    const periodsScores = [
        [filterGoalByPeriod(player1, 0, 20).length, filterGoalByPeriod(player2, 0, 20).length],
        [filterGoalByPeriod(player1, 20, 40).length, filterGoalByPeriod(player2, 20, 40).length],
        [player1.goals.filter(goal => goal >= 40).length, player2.goals.filter(goal => goal >= 40).length],
    ];

    const allGoals = [];
    player1.goals.forEach(goal => {
        allGoals.push({player: 1, time: goal});
    });
    player2.goals.forEach(goal => {
        allGoals.push({player: 2, time: goal});
    })

    allGoals.sort((a, b) => a.time > b.time);
    console.log(allGoals);
    return (
        <div className="intermissionScreen">
            <h1 className="score">{player1.goals.length} : {player2.goals.length}</h1>
            <h2 className="periodsScores">
                {periodsScores.map(periodScore => `-(${periodScore[0]} : ${periodScore[1]})-`)}
            </h2>
            <div className='goals'>
                {allGoals.map((goal) => 
                    <p key={goal.time} className={goal.player === 1 ? 'p1Goal' : 'p2Goal'}>
                        {Math.floor(goal.time)}
                    </p>
                )}
            </div>
        </div>
        );
}

export default Intermission;