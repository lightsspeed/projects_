// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const tileSize = 40; // Each tile is 40x40 pixels
const gridSize = 10; // 10x10 grid (400px canvas)
canvas.width = tileSize * gridSize;
canvas.height = tileSize * gridSize;

let player = { x: 0, y: 0, paint: 100 };
let grid = [];
let enemies = [];
let powerUps = [];
let level = 1;
let timeLeft = 30;
let gameActive = false;
let timerInterval = null;

// DOM elements
const levelElement = document.getElementById('level');
const timeElement = document.getElementById('time');
const paintElement = document.getElementById('paint');
const startBtn = document.getElementById('start-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const closeHowToPlayBtn = document.getElementById('close-how-to-play-btn');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const howToPlayModal = document.getElementById('how-to-play-modal');
const gameOverModal = document.getElementById('game-over-modal');
const levelCompleteModal = document.getElementById('level-complete-modal');
const gameOverMessage = document.getElementById('game-over-message');
const finalLevelElement = document.getElementById('final-level');
const timeLeftElement = document.getElementById('time-left');
const nextLevelElement = document.getElementById('next-level');

// Event listeners
startBtn.addEventListener('click', startGame);
howToPlayBtn.addEventListener('click', () => howToPlayModal.classList.add('active'));
closeHowToPlayBtn.addEventListener('click', () => howToPlayModal.classList.remove('active'));
restartBtn.addEventListener('click', restartGame);
nextLevelBtn.addEventListener('click', nextLevel);

// Player movement
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    let newX = player.x;
    let newY = player.y;

    if (e.key === 'ArrowUp' || e.key === 'w') newY--;
    if (e.key === 'ArrowDown' || e.key === 's') newY++;
    if (e.key === 'ArrowLeft' || e.key === 'a') newX--;
    if (e.key === 'ArrowRight' || e.key === 'd') newX++;

    if (isValidMove(newX, newY)) {
        player.x = newX;
        player.y = newY;
        paintTile(newX, newY);
        checkPowerUpCollision();
        checkWinCondition();
    }
});

// Initialize game
initGame();

// Functions
function initGame() {
    // Initialize grid (0 = unpainted, 1 = painted, 2 = wall)
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));

    // Add walls based on level
    const numWalls = Math.min(5 + level * 2, 30);
    for (let i = 0; i < numWalls; i++) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        if (x !== 0 || y !== 0) { // Don't block starting position
            grid[y][x] = 2;
        }
    }

    // Reset player
    player = { x: 0, y: 0, paint: 100 };
    grid[0][0] = 1; // Start position is painted

    // Add enemies (erasers)
    enemies = [];
    const numEnemies = Math.min(1 + Math.floor(level / 2), 5);
    for (let i = 0; i < numEnemies; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * gridSize);
            y = Math.floor(Math.random() * gridSize);
        } while (grid[y][x] !== 0 || (x === 0 && y === 0));
        enemies.push({ x, y });
    }

    // Add power-ups
    powerUps = [];
    const numPowerUps = Math.min(2 + Math.floor(level / 3), 5);
    for (let i = 0; i < numPowerUps; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * gridSize);
            y = Math.floor(Math.random() * gridSize);
        } while (grid[y][x] !== 0 || (x === 0 && y === 0));
        powerUps.push({ x, y, type: Math.random() > 0.5 ? 'speed' : 'paint' });
    }

    // Update UI
    levelElement.textContent = level;
    timeElement.textContent = timeLeft;
    paintElement.textContent = `${Math.floor(player.paint)}%`;

    render();
}

function startGame() {
    if (gameActive) return;

    gameActive = true;
    startBtn.textContent = 'Restart';
    timeLeft = 30;
    initGame();

    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        timeElement.textContent = Math.floor(timeLeft);

        if (timeLeft <= 0) {
            endGame('Time ran out!');
        }

        // Reduce paint over time
        player.paint = Math.max(0, player.paint - 0.1);
        paintElement.textContent = `${Math.floor(player.paint)}%`;
        if (player.paint <= 0) {
            endGame('You ran out of paint!');
        }

        // Move enemies
        enemies.forEach(enemy => moveEnemy(enemy));
        render();
    }, 100);
}

function restartGame() {
    gameOverModal.classList.remove('active');
    level = 1;
    startGame();
}

function nextLevel() {
    levelCompleteModal.classList.remove('active');
    level++;
    startGame();
}

function isValidMove(x, y) {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize && grid[y][x] !== 2;
}

function paintTile(x, y) {
    if (grid[y][x] === 0) {
        grid[y][x] = 1;
        player.paint = Math.max(0, player.paint - 1);
        paintElement.textContent = `${Math.floor(player.paint)}%`;
    }
}

function checkPowerUpCollision() {
    powerUps = powerUps.filter(powerUp => {
        if (powerUp.x === player.x && powerUp.y === player.y) {
            if (powerUp.type === 'speed') {
                timeLeft += 5; // Add time as a "speed" boost
            } else {
                player.paint = Math.min(100, player.paint + 20);
            }
            return false;
        }
        return true;
    });
}

function moveEnemy(enemy) {
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
    ];

    const dir = directions[Math.floor(Math.random() * directions.length)];
    const newX = enemy.x + dir.dx;
    const newY = enemy.y + dir.dy;

    if (isValidMove(newX, newY) && !(newX === player.x && newY === player.y)) {
        // Unpaint the current tile if it was painted
        if (grid[enemy.y][enemy.x] === 1) {
            grid[enemy.y][enemy.x] = 0;
        }

        enemy.x = newX;
        enemy.y = newY;
    }
}

function checkWinCondition() {
    const totalTiles = gridSize * gridSize - grid.flat().filter(tile => tile === 2).length;
    const paintedTiles = grid.flat().filter(tile => tile === 1).length;

    if (paintedTiles === totalTiles) {
        clearInterval(timerInterval);
        gameActive = false;
        timeLeftElement.textContent = Math.floor(timeLeft);
        nextLevelElement.textContent = level + 1;
        levelCompleteModal.classList.add('active');
    }
}

function endGame(message) {
    clearInterval(timerInterval);
    gameActive = false;
    gameOverMessage.textContent = message;
    finalLevelElement.textContent = level;
    gameOverModal.classList.add('active');
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] === 0) {
                ctx.fillStyle = '#888';
            } else if (grid[y][x] === 1) {
                ctx.fillStyle = '#ffcc00';
            } else {
                ctx.fillStyle = '#333';
            }
            ctx.fillRect(x * tileSize, y * tileSize, tileSize - 2, tileSize - 2);
        }
    }

    // Draw power-ups
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'speed' ? '#00ff00' : '#ff00ff';
        ctx.beginPath();
        ctx.arc(
            powerUp.x * tileSize + tileSize / 2,
            powerUp.y * tileSize + tileSize / 2,
            tileSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x * tileSize + 5, enemy.y * tileSize + 5, tileSize - 10, tileSize - 10);
    });

    // Draw player
    ctx.fillStyle = '#00ccff';
    ctx.fillRect(player.x * tileSize + 5, player.y * tileSize + 5, tileSize - 10, tileSize - 10);
}