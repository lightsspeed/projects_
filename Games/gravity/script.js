const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const tileSize = 40;
const gridSize = 10;
canvas.width = tileSize * gridSize;
canvas.height = tileSize * gridSize;

let player = { x: 1, y: 1, gravity: 1, vy: 0, onGround: false };
let level = 1;
let moves = 0;
let gameActive = false;
let levelData = [
    // Level 1
    [
        "##########",
        "#P  S    #",
        "#   #    #",
        "#   #    #",
        "#   #    #",
        "#   #    #",
        "#   #    #",
        "#   #    #",
        "#   E    #",
        "##########"
    ],
    // Level 2
    [
        "##########",
        "#P  S    #",
        "#   #    #",
        "#   #  G #",
        "#   #    #",
        "#   #    #",
        "#   #    #",
        "#   #    #",
        "#   E    #",
        "##########"
    ],
    // Level 3
    [
        "##########",
        "#P  S    #",
        "#   #    #",
        "#   #  G #",
        "#   #    #",
        "#   #    #",
        "#   #    #",
        "#   A    #",
        "#   B  E #",
        "##########"
    ]
];

// Game objects
let grid = [];
let portals = [];
let exit = { x: 0, y: 0 };
let startPos = { x: 0, y: 0 };

// DOM elements
const levelElement = document.getElementById('level');
const movesElement = document.getElementById('moves');
const startBtn = document.getElementById('start-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const closeHowToPlayBtn = document.getElementById('close-how-to-play-btn');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const howToPlayModal = document.getElementById('how-to-play-modal');
const gameOverModal = document.getElementById('game-over-modal');
const levelCompleteModal = document.getElementById('level-complete-modal');
const finalLevelElement = document.getElementById('final-level');
const movesUsedElement = document.getElementById('moves-used');
const nextLevelElement = document.getElementById('next-level');

// Event listeners
startBtn.addEventListener('click', startGame);
howToPlayBtn.addEventListener('click', () => howToPlayModal.classList.add('active'));
closeHowToPlayBtn.addEventListener('click', () => howToPlayModal.classList.remove('active'));
restartBtn.addEventListener('click', restartGame);
nextLevelBtn.addEventListener('click', nextLevel);

document.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    if (e.key === 'ArrowLeft') {
        movePlayer(-1, 0);
    } else if (e.key === 'ArrowRight') {
        movePlayer(1, 0);
    } else if (e.key === 'ArrowUp') {
        if (player.onGround) {
            player.vy = -0.3 * player.gravity;
            player.onGround = false;
            moves++;
        }
    } else if (e.key === ' ') {
        player.gravity *= -1;
        player.vy = 0;
        moves++;
    }
    movesElement.textContent = moves;
});

function startGame() {
    gameActive = true;
    startBtn.textContent = 'Restart';
    level = 1;
    moves = 0;
    loadLevel();
    gameLoop();
}

function restartGame() {
    gameOverModal.classList.remove('active');
    level = 1;
    moves = 0;
    startGame();
}

function nextLevel() {
    levelCompleteModal.classList.remove('active');
    level++;
    if (level >= levelData.length) {
        level = 0; // Loop back to first level
    }
    moves = 0;
    loadLevel();
}

function loadLevel() {
    grid = [];
    portals = [];
    const currentLevel = levelData[level - 1];

    for (let y = 0; y < gridSize; y++) {
        grid[y] = [];
        for (let x = 0; x < gridSize; x++) {
            const tile = currentLevel[y][x];
            grid[y][x] = tile === '#' ? 1 : 0; // 1 = wall, 0 = empty

            if (tile === 'P') {
                player.x = x;
                player.y = y;
                startPos = { x, y };
            } else if (tile === 'E') {
                exit = { x, y };
            } else if (tile === 'S') {
                grid[y][x] = 2; // Spikes
            } else if (tile === 'G') {
                grid[y][x] = 3; // Glitch zone
            } else if (tile === 'A' || tile === 'B') {
                portals.push({ x, y, type: tile });
            }
        }
    }

    player.gravity = 1;
    player.vy = 0;
    player.onGround = false;
    levelElement.textContent = level;
    movesElement.textContent = moves;
}

function movePlayer(dx, dy) {
    const newX = Math.round(player.x + dx);
    const newY = Math.round(player.y + dy);

    if (isValidMove(newX, newY)) {
        player.x = newX;
        player.y = newY;
        moves++;
        checkCollisions();
    }
}

function isValidMove(x, y) {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize && grid[y][x] !== 1;
}

function checkCollisions() {
    // Spikes or glitch zones
    if (grid[Math.round(player.y)][Math.round(player.x)] === 2 || grid[Math.round(player.y)][Math.round(player.x)] === 3) {
        player.x = startPos.x;
        player.y = startPos.y;
        player.vy = 0;
        player.gravity = 1;
        gameActive = false;
        finalLevelElement.textContent = level;
        gameOverModal.classList.add('active');
        return;
    }

    // Portals
    const portal = portals.find(p => p.x === Math.round(player.x) && p.y === Math.round(player.y));
    if (portal) {
        const targetPortal = portals.find(p => p.type !== portal.type);
        if (targetPortal) {
            player.x = targetPortal.x;
            player.y = targetPortal.y;
        }
    }

    // Exit
    if (Math.round(player.x) === exit.x && Math.round(player.y) === exit.y) {
        gameActive = false;
        movesUsedElement.textContent = moves;
        nextLevelElement.textContent = level + 1;
        levelCompleteModal.classList.add('active');
    }
}

function gameLoop() {
    if (!gameActive) return;

    // Apply gravity
    player.vy += 0.02 * player.gravity;
    player.y += player.vy;

    // Check for ground/ceiling collision
    if (player.gravity > 0) {
        if (player.y >= gridSize - 1 || grid[Math.round(player.y + 0.5)][Math.round(player.x)] === 1) {
            player.y = Math.floor(player.y);
            player.vy = 0;
            player.onGround = true;
        } else {
            player.onGround = false;
        }
    } else {
        if (player.y <= 0 || grid[Math.round(player.y - 0.5)][Math.round(player.x)] === 1) {
            player.y = Math.ceil(player.y);
            player.vy = 0;
            player.onGround = true;
        } else {
            player.onGround = false;
        }
    }

    checkCollisions();
    render();

    requestAnimationFrame(gameLoop);
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] === 1) {
                ctx.fillStyle = '#00ffcc';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            } else if (grid[y][x] === 2) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            } else if (grid[y][x] === 3) {
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }

    // Draw portals
    portals.forEach(portal => {
        ctx.fillStyle = portal.type === 'A' ? '#00ff00' : '#0000ff';
        ctx.beginPath();
        ctx.arc(
            portal.x * tileSize + tileSize / 2,
            portal.y * tileSize + tileSize / 2,
            tileSize / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Draw exit
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(exit.x * tileSize, exit.y * tileSize, tileSize, tileSize);

    // Draw player
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
}