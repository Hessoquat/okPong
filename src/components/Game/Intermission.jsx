import '../../assets/style/intermission.css'
function Intermission   ({player1, player2, period, onNext, settings}) {
    const periodsScores = [];
    const filterGoalByPeriod = 
        (player, lowerTimeLimit, upperTimeLimit) => player.goals.filter((goal) => {
            if (upperTimeLimit === settings.time.nbPeriods * settings.time.periodLength) return goal >= lowerTimeLimit
            return goal >= lowerTimeLimit && goal < upperTimeLimit
        }
        ); 

    const sortPeriodsScore = () => {
        for (let i=0; i < settings.time.nbPeriods; i++) {
            periodsScores.push([
                filterGoalByPeriod(player1, i * settings.time.periodLength, (i +1) * settings.time.periodLength).length,
                filterGoalByPeriod(player2, i * settings.time.periodLength, (i +1) * settings.time.periodLength).length
            ]);
        }
    }

    const allGoals = [];
    const sortGoalbyTime = () => {
        player1.goals.forEach(goal => {
            allGoals.push({player: 1, time: goal});
        });
        player2.goals.forEach(goal => {
            allGoals.push({player: 2, time: goal});
        });
        allGoals.sort((a, b) => a.time > b.time);
    }

    const handleNext= () =>  {
        
        if (period !== settings.time.nbPeriods) {
            onNext();
            return;
        }
    }
    sortPeriodsScore();
    sortGoalbyTime();
    return (
        <div className="intermissionScreen">
            <div className='gameData'>
                <h1 className="score">{player1.goals.length} : {player2.goals.length}</h1>
                <h2>{period}</h2>
                <h3 className="periodsScores">
                    {periodsScores.map(periodScore => `-(${periodScore[0]} : ${periodScore[1]})-`)}
                </h3>
                <div className='goals'>
                    {allGoals.map((goal) => 
                        <p key={goal.time} className={goal.player === 1 ? 'p1Goal' : 'p2Goal'}>
                            {Math.floor(goal.time)}
                        </p>
                    )}
                </div>
            </div>
            <div className='intermissionButtons'>
                <button onClick={handleNext}>next</button>
            </div>
        </div>
        );
}

export default Intermission;