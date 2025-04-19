// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

const player = {
    x: 50,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    velocityY: 0,
    jumping: false,
    health: 100,
    shield: false
};
let obstacles = [];
let powerUps = [];
let score = 0;
let gameActive = false;
let gameSpeed = 2;
let stage = 0; // 0: Code, 1: Build, 2: Test, 3: Deploy
const stages = ['Code', 'Build', 'Test', 'Deploy'];
let timerInterval = null;

// DOM elements
const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
const stageElement = document.getElementById('stage');
const startBtn = document.getElementById('start-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const closeHowToPlayBtn = document.getElementById('close-how-to-play-btn');
const restartBtn = document.getElementById('restart-btn');
const shareBtn = document.getElementById('share-btn');
const howToPlayModal = document.getElementById('how-to-play-modal');
const gameOverModal = document.getElementById('game-over-modal');
const gameOverMessage = document.getElementById('game-over-message');
const finalScoreElement = document.getElementById('final-score');

// Event listeners
startBtn.addEventListener('click', startGame);
howToPlayBtn.addEventListener('click', () => howToPlayModal.classList.add('active'));
closeHowToPlayBtn.addEventListener('click', () => howToPlayModal.classList.remove('active'));
restartBtn.addEventListener('click', restartGame);
shareBtn.addEventListener('click', shareScore);

// Player controls
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !player.jumping && gameActive) {
        player.velocityY = -12;
        player.jumping = true;
    }
});

// Initialize game
initGame();

// Functions
function initGame() {
    player.x = 50;
    player.y = canvas.height - 50;
    player.velocityY = 0;
    player.jumping = false;
    player.health = 100;
    player.shield = false;
    obstacles = [];
    powerUps = [];
    score = 0;
    gameSpeed = 2;
    stage = 0;
    gameActive = false;

    // Update UI
    scoreElement.textContent = score;
    healthElement.textContent = `${Math.floor(player.health)}%`;
    stageElement.textContent = stages[stage];

    render();
}

function startGame() {
    if (gameActive) {
        initGame();
    }

    gameActive = true;
    startBtn.textContent = 'Restart';

    // Game loop
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameActive) return;

        // Update player
        player.velocityY += 0.5; // Gravity
        player.y += player.velocityY;
        if (player.y > canvas.height - player.height) {
            player.y = canvas.height - player.height;
            player.velocityY = 0;
            player.jumping = false;
        }

        // Increase game speed
        gameSpeed += 0.005;

        // Update stage
        stage = Math.floor(score / 500) % stages.length;
        stageElement.textContent = stages[stage];

        // Spawn obstacles
        if (Math.random() < 0.02 * gameSpeed) {
            let type;
            if (stage === 0) type = 'bug'; // Code stage
            else if (stage === 1) type = 'build'; // Build stage
            else if (stage === 2) type = 'test'; // Test stage
            else type = 'cloud'; // Deploy stage
            obstacles.push({
                x: canvas.width,
                y: canvas.height - 30,
                width: type === 'test' ? 10 : 20,
                height: type === 'test' ? 100 : 20,
                type
            });
        }

        // Spawn power-ups
        if (Math.random() < 0.01) {
            powerUps.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - 100) + 50,
                width: 15,
                height: 15,
                type: Math.random() > 0.5 ? 'shield' : 'boost'
            });
        }

        // Move obstacles
        obstacles = obstacles.filter(obstacle => {
            obstacle.x -= gameSpeed;
            if (obstacle.x + obstacle.width < 0) return false;

            // Collision detection
            if (
                player.x < obstacle.x + obstacle.width &&
                player.x + player.width > obstacle.x &&
                player.y < obstacle.y + obstacle.height &&
                player.y + player.height > obstacle.y
            ) {
                if (obstacle.type === 'cloud') {
                    score += 100; // Bonus for deploying
                    return false;
                } else if (obstacle.type === 'test') {
                    if (!player.shield) {
                        endGame('Failed unit test!');
                    }
                    return false;
                } else {
                    if (!player.shield) {
                        player.health -= obstacle.type === 'bug' ? 20 : 30;
                        healthElement.textContent = `${Math.floor(player.health)}%`;
                        if (player.health <= 0) {
                            endGame('Too many bugs and failed builds!');
                        }
                    }
                    return false;
                }
            }
            return true;
        });

        // Move power-ups
        powerUps = powerUps.filter(powerUp => {
            powerUp.x -= gameSpeed;
            if (powerUp.x + powerUp.width < 0) return false;

            // Collision detection
            if (
                player.x < powerUp.x + powerUp.width &&
                player.x + player.width > powerUp.x &&
                player.y < powerUp.y + powerUp.height &&
                player.y + player.height > powerUp.y
            ) {
                if (powerUp.type === 'shield') {
                    player.shield = true;
                    setTimeout(() => (player.shield = false), 5000);
                } else {
                    gameSpeed += 1;
                }
                return false;
            }
            return true;
        });

        // Update score
        score += gameSpeed;
        scoreElement.textContent = Math.floor(score);

        render();
    }, 1000 / 60);
}

function restartGame() {
    gameOverModal.classList.remove('active');
    startGame();
}

function shareScore() {
    const finalScore = Math.floor(score);
    const text = `I scored ${finalScore} in Pipeline Runner: Code to Cloud! Can you survive the CI/CD pipeline? #PipelineRunner`;
    navigator.clipboard.writeText(text).then(() => {
        alert('Score copied to clipboard! Share it on social media!');
    });
}

function endGame(message) {
    clearInterval(timerInterval);
    gameActive = false;
    gameOverMessage.textContent = message;
    finalScoreElement.textContent = Math.floor(score);
    gameOverModal.classList.add('active');
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background (pipeline track)
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

    // Draw obstacles
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'bug') {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'build') {
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else if (obstacle.type === 'test') {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(obstacle.x, obstacle.y - obstacle.height + 30, obstacle.width, obstacle.height);
        } else {
            ctx.fillStyle = '#00ccff';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'shield' ? '#00ff00' : '#ffff00';
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player
    ctx.fillStyle = player.shield ? '#00ff00' : '#00ccff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}