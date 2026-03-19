export const paddleStep = (playerPosition, isUpPressed, isDownPressed, settings) => {
    if (isUpPressed) return playerPosition <= 0 ? 0 : playerPosition - settings.paddle.speed;
    if (isDownPressed) return playerPosition >= 100 - settings.paddle.height 
                    ? 100- settings.paddle.height 
                    : playerPosition + settings.paddle.speed;
    return playerPosition;
}