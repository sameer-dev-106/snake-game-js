// ============================================
// DOM ELEMENTS
// ============================================
const board = document.querySelector('.board');
const modal = document.querySelector('.modal');
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const gamePauseModal = document.querySelector('.game-pause');

const startButton = document.querySelector('.btn-start');
const restartButtons = document.querySelectorAll('.btn-restart');
const speedButtons = document.querySelectorAll("[data-speed]");

const highScoreElement = document.querySelector('#high-score');
const scoreElement = document.querySelector('#score');
const timeElement = document.querySelector('#time');

// ============================================
// CONSTANTS
// ============================================
const BLOCK_SIZE = 30;
const COLS = Math.floor(board.clientWidth / BLOCK_SIZE);
const ROWS = Math.floor(board.clientHeight / BLOCK_SIZE);

// ============================================
// AUDIO
// ============================================
const sounds = {
    moving: new Audio('./sound/snake-moving.mp3'),
    eat: new Audio('./sound/eating.mp3'),
    gameOver: new Audio('./sound/game-over.mp3')
};

sounds.moving.loop = true;
sounds.moving.volume = 0.2;

// ============================================
// GAME STATE
// ============================================
let gameState = {
    highScore: parseInt(localStorage.getItem("highScore")) || 0,
    score: 0,
    time: '00-00',
    speed: 300,
    direction: 'right',
    isPaused: false,
    hasStarted: false,
    intervalId: null,
    timeIntervalId: null,
    food: generateRandomPosition(),
    snake: [{ x: 3, y: 4 }],
    touchStart: { x: 0, y: 0 }
};

// Initialize high score display
highScoreElement.innerHTML = gameState.highScore;

// ============================================
// BOARD SETUP
// ============================================
const blocks = {};

function createBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const block = document.createElement('div');
            block.classList.add('block');
            board.appendChild(block);
            blocks[`${row}-${col}`] = block;
        }
    }
}

createBoard();

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * ROWS),
        y: Math.floor(Math.random() * COLS)
    };
}

function updateDisplay() {
    scoreElement.innerHTML = gameState.score;
    timeElement.innerHTML = gameState.time;
    highScoreElement.innerHTML = gameState.highScore;
}

function showModal(modalToShow) {
    modal.style.display = 'flex';
    startGameModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    gamePauseModal.style.display = 'none';

    if (modalToShow) modalToShow.style.display = 'flex';
}

function hideModal() {
    modal.style.display = 'none';
    startGameModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    gamePauseModal.style.display = 'none';
}

// ============================================
// TIME COUNTER
// ============================================
function timeCounter() {
    let [min, sec] = gameState.time.split('-').map(Number);

    sec++;
    if (sec === 60) {
        min++;
        sec = 0;
    }

    gameState.time = `${String(min).padStart(2, '0')}-${String(sec).padStart(2, '0')}`;
    updateDisplay();
}

// ============================================
// GAME LOGIC
// ============================================
function getNextHead() {
    const head = gameState.snake[0];
    const moves = {
        down: { x: head.x + 1, y: head.y },
        up: { x: head.x - 1, y: head.y },
        left: { x: head.x, y: head.y - 1 },
        right: { x: head.x, y: head.y + 1 }
    };
    return moves[gameState.direction];
}

function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= ROWS || head.y < 0 || head.y >= COLS) {
        return true;
    }
    // Self collision
    return gameState.snake.some(seg => seg.x === head.x && seg.y === head.y);
}

function handleFoodEaten(head) {
    // Remove old food
    const foodBlock = blocks[`${gameState.food.x}-${gameState.food.y}`];
    if (foodBlock) foodBlock.classList.remove('food');

    // Generate new food
    gameState.food = generateRandomPosition();
    blocks[`${gameState.food.x}-${gameState.food.y}`].classList.add('food');

    // Grow snake
    gameState.snake.push(head);

    // Update score
    gameState.score += 10;
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('highScore', gameState.highScore);
    }
    updateDisplay();

    sounds.eat.play();
}

function clearSnake() {
    gameState.snake.forEach(segment => {
        const block = blocks[`${segment.x}-${segment.y}`];
        if (block) block.classList.remove('fill');
    });
}

function drawSnake() {
    gameState.snake.forEach(segment => {
        const block = blocks[`${segment.x}-${segment.y}`];
        if (block) block.classList.add('fill');
    });
}

function renderSnake() {
    if (gameState.isPaused) return;

    // Draw food
    blocks[`${gameState.food.x}-${gameState.food.y}`].classList.add('food');

    const head = getNextHead();

    // Check collisions
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // Clear previous snake
    clearSnake();

    // Check if food eaten
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        handleFoodEaten(head);
    }

    // Move snake
    gameState.snake.unshift(head);
    gameState.snake.pop();

    // Draw snake
    drawSnake();
}

// ============================================
// GAME CONTROLS
// ============================================
function startGame() {
    hideModal();
    gameState.hasStarted = true;
    sounds.moving.play();

    clearInterval(gameState.intervalId);
    clearInterval(gameState.timeIntervalId);

    gameState.intervalId = setInterval(renderSnake, gameState.speed);
    gameState.timeIntervalId = setInterval(timeCounter, 1000);
    gameState.isPaused = false;
}

function restartGame() {
    // Clear intervals
    clearInterval(gameState.intervalId);
    clearInterval(gameState.timeIntervalId);

    // Hide modals
    hideModal();

    // Reset audio
    sounds.moving.play();

    // Clear board
    clearSnake();
    const foodBlock = blocks[`${gameState.food.x}-${gameState.food.y}`];
    if (foodBlock) foodBlock.classList.remove('food');

    // Reset game state
    gameState.score = 0;
    gameState.time = '00-00';
    gameState.direction = 'right';
    gameState.isPaused = false;
    gameState.hasStarted = true;
    gameState.snake = [generateRandomPosition()];
    gameState.food = generateRandomPosition();

    // Update display
    updateDisplay();
    blocks[`${gameState.food.x}-${gameState.food.y}`].classList.add('food');

    // Start game
    gameState.intervalId = setInterval(renderSnake, gameState.speed);
    gameState.timeIntervalId = setInterval(timeCounter, 1000);
}

function gameOver() {
    clearInterval(gameState.intervalId);
    clearInterval(gameState.timeIntervalId);

    sounds.gameOver.play();
    sounds.moving.pause();

    gameState.isPaused = false;
    gameState.hasStarted = false;
    showModal(gameOverModal);

    board.classList.add('shake');
    setTimeout(() => board.classList.remove('shake'), 300);
}

function togglePause() {
    // Don't pause if game hasn't started or already over
    if (!gameState.hasStarted) return; 

    if (gameState.isPaused) {
        // Resume
        gameState.intervalId = setInterval(renderSnake, gameState.speed);
        gameState.timeIntervalId = setInterval(timeCounter, 1000);
        gameState.isPaused = false;
        hideModal();
        sounds.moving.play();
    } else {
        // Pause
        clearInterval(gameState.intervalId);
        clearInterval(gameState.timeIntervalId);
        gameState.isPaused = true;
        showModal(gamePauseModal);
        sounds.moving.pause();
    }
}

function handleEnterAction() {
    if (startGameModal.style.display !== 'none') {
        startGame();
    } else if (gameOverModal.style.display !== 'none') {
        restartGame();
    } else if (gamePauseModal.style.display !== 'none') {
        togglePause();
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Speed selection
speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.speed = Number(btn.dataset.speed);
    });
});

// Keyboard controls
addEventListener('keydown', (e) => {
    const { direction } = gameState;

    if (e.key === "ArrowUp" && direction !== 'down') gameState.direction = 'up';
    if (e.key === 'ArrowDown' && direction !== 'up') gameState.direction = 'down';
    if (e.key === 'ArrowLeft' && direction !== 'right') gameState.direction = 'left';
    if (e.key === 'ArrowRight' && direction !== 'left') gameState.direction = 'right';
    if (e.key === ' ') togglePause();
    if (e.key === 'Enter') handleEnterAction();
});

// Touch controls
board.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    gameState.touchStart.x = touch.clientX;
    gameState.touchStart.y = touch.clientY;
});

board.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - gameState.touchStart.x;
    const dy = touch.clientY - gameState.touchStart.y;
    const { direction } = gameState;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0 && direction !== 'left') gameState.direction = 'right';
        if (dx < 0 && direction !== 'right') gameState.direction = 'left';
    } else {
        // Vertical swipe
        if (dy > 0 && direction !== 'up') gameState.direction = 'down';
        if (dy < 0 && direction !== 'down') gameState.direction = 'up';
    }
});

// Button controls
startButton.addEventListener('click', startGame);
restartButtons.forEach(btn => btn.addEventListener('click', restartGame));