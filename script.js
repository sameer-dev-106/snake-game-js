// ============================================
// DOM ELEMENTS
// ============================================
const board = document.querySelector('.board');
const modal = document.querySelector('.modal');
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const gamePauseModal = document.querySelector('.game-pause');
const gameLevleModal = document.querySelector('.game-levels');
const gameLoadingPage = document.querySelector('.loading-page');

const startButton = document.querySelector('.btn-start');
const restartButtons = document.querySelectorAll('.btn-restart');
const clearScoreBtn = document.querySelector("#clear-score-btn");
const resumeButton = document.querySelector('.btn-resume');
const pauseButton = document.querySelector('.btn-pause');
const speedButtons = document.querySelectorAll("[data-speed]");
const muteButton = document.querySelector('.btn-mute');

const mobileArrowButtons = document.querySelectorAll('.arrow-btn');

const highScoreElement = document.querySelector('#high-score');
const scoreElement = document.querySelector('#score');
const timeElement = document.querySelector('#time');

const finalScoreEl = document.querySelector("#final-score");
const finalHighScoreEl = document.querySelector("#final-high-score");
const finalTimeEl = document.querySelector("#final-time");

// ============================================
// CONSTANTS
// ============================================
let CELL_SIZE = getCellSize();
let COLS = Math.floor(board.clientWidth / CELL_SIZE);
let ROWS = Math.floor(board.clientHeight / CELL_SIZE);

// ============================================
// AUDIO
// ============================================
const sounds = {
    moving: new Audio('./sound/snake-moving.mp3'),
    eat: new Audio('./sound/eating.mp3'),
    gameOver: new Audio('./sound/game-over.mp3'),
    loading: new Audio('./sound/loading-sound.mp3')
};

sounds.moving.loop = true;
sounds.moving.volume = 0.2;

// ============================================
// GAME STATE
// ============================================
let gameState = {
    highScore: parseInt(localStorage.getItem("highScore")) || 0,
    isMuted: JSON.parse(localStorage.getItem("isMuted")) || false,
    score: 0,
    time: 0,
    speed: 300,
    direction: 'right',
    isPaused: false,
    hasStarted: false,
    intervalId: null,
    timeIntervalId: null,
    snake: [getSafeSnakePosition()],
    food: null,
    touchStart: { x: 0, y: 0 }
};

// Initialize high score display
highScoreElement.innerHTML = gameState.highScore;

// cell creating
function getCellSize() {
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue("--cell-size"));
}
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
function getSafeSnakePosition() {
    return {
        x: Math.floor(Math.random() * (ROWS - 6)) + 3,
        y: Math.floor(Math.random() * (COLS - 6)) + 3
    };
}

function generateFoodPosition() {
    let position;
    let isOnSnake;

    do {
        position = {
            x: Math.floor(Math.random() * ROWS),
            y: Math.floor(Math.random() * COLS)
        };

        isOnSnake = gameState.snake.some(
            seg => seg.x === position.x && seg.y === position.y
        );

    } while (isOnSnake);

    return position;
}

function formatTime(totalSeconds) {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function updateDisplay() {
    scoreElement.innerHTML = gameState.score;
    highScoreElement.innerHTML = gameState.highScore;
}

function showModal(modalToShow) {
    modal.style.display = 'flex';
    gameLevleModal.style.display = 'flex';
    gamePauseModal.style.display = 'none';
    startGameModal.style.display = 'none';
    gameOverModal.style.display = 'none';

    if (modalToShow) modalToShow.style.display = 'flex';
}

function hideModal() {
    modal.style.display = 'none';
    startGameModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    gamePauseModal.style.display = 'none';
}

function updateClearScoreVisibility() {
    const storedScore = localStorage.getItem("highScore");
    clearScoreBtn.style.display = storedScore ? "block" : "none";
}

// ============================================
// TIME COUNTER
// ============================================
function timeCounter() {
    gameState.time++;

    const min = Math.floor(gameState.time / 60);
    const sec = gameState.time % 60;

    timeElement.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ============================================
// GAME LOGIC
// ============================================
function getNextHead() {
    const head = gameState.snake[0];
    let next = { x: head.x, y: head.y };

    if (gameState.direction === "up") next.x--;
    if (gameState.direction === "down") next.x++;
    if (gameState.direction === "left") next.y--;
    if (gameState.direction === "right") next.y++;

    // 🔁 WRAP LOGIC
    if (next.x < 0) next.x = ROWS - 1;
    if (next.x >= ROWS) next.x = 0;
    if (next.y < 0) next.y = COLS - 1;
    if (next.y >= COLS) next.y = 0;

    return next;
}


function checkCollision(head) {
    // Self collision
    return gameState.snake.some(seg => seg.x === head.x && seg.y === head.y);
}

function handleFoodEaten(head) {
    // Remove old food
    const foodBlock = blocks[`${gameState.food.x}-${gameState.food.y}`];
    if (foodBlock) foodBlock.classList.remove('food');

    // Generate new food
    gameState.food = generateFoodPosition();
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

    gameState.time = 0;
    timeElement.textContent = "00:00";

    const safePos = getSafeSnakePosition();
    gameState.snake = [safePos];
    gameState.food = generateFoodPosition();


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
    gameState.time = 0;
    timeElement.textContent = formatTime(0);
    gameState.direction = 'right';
    gameState.isPaused = false;
    gameState.hasStarted = true;

    // Snake and Food 
    const safePos = getSafeSnakePosition();
    gameState.snake = [safePos];
    gameState.food = generateFoodPosition();

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

    // Final Score showing
    finalScoreEl.textContent = gameState.score;
    finalHighScoreEl.textContent = gameState.highScore;
    finalTimeEl.textContent = formatTime(gameState.time);

    gameState.isPaused = false;
    gameState.hasStarted = false;
    showModal(gameOverModal);

    board.classList.add('shake');
    setTimeout(() => board.classList.remove('shake'), 300);
}

function loadingPage(fnc) {
    gameState.isPaused = true;
    document.querySelector('.loading-page').style.display = 'flex'
    startGameModal.style.display = 'none'
    gameOverModal.style.display = 'none'
    gamePauseModal.style.display = 'none'
    gameLevleModal.style.display = 'none'
    sounds.loading.play()
    setTimeout(() => {
        sounds.loading.pause();
        sounds.loading.currentTime = 0;
        fnc();
        gameLoadingPage.style.display = 'none'
    }, 2000);
}

function clearHighScore() {
    localStorage.removeItem("highScore");
    gameState.highScore = 0;

    highScoreElement.textContent = 0;
    finalHighScoreEl.textContent = 0;

    updateClearScoreVisibility();
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    localStorage.setItem("isMuted", gameState.isMuted);

    Object.values(sounds).forEach(sound => {
        sound.muted = gameState.isMuted;
    });

    if (gameState.isMuted) muteButton.innerHTML = "🔇";
    else muteButton.innerHTML = "🔊";
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
        loadingPage(startGame);
    } else if (gameOverModal.style.display !== 'none') {
        loadingPage(restartGame);
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
        const newSpeed = Number(btn.dataset.speed);
        // Same speed hai to kuch mat karo
        if (gameState.speed === newSpeed) return;
        // Game chal rahi hai aur paused nahi hai
        if (gameState.hasStarted && !gameState.isPaused) return;
        // Adding new speed value
        gameState.speed = newSpeed;
        // Agar game already start ho chuki hai
        if (gameState.hasStarted) loadingPage(restartGame);
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

// Mobile controls
mobileArrowButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const direction = gameState.direction;

        if (btn.id === "upBtn" && direction !== 'down') gameState.direction = 'up';
        if (btn.id === "downBtn" && direction !== 'up') gameState.direction = 'down';
        if (btn.id === "leftBtn" && direction !== 'right') gameState.direction = 'left';
        if (btn.id === "rightBtn" && direction !== 'left') gameState.direction = 'right';
    });
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


window.addEventListener("resize", () => {
    CELL_SIZE = getCellSize();
    COLS = Math.floor(board.clientWidth / CELL_SIZE);
    ROWS = Math.floor(board.clientHeight / CELL_SIZE);

    board.innerHTML = "";
    Object.keys(blocks).forEach(k => delete blocks[k]);

    createBoard();
});

window.addEventListener('keydown', (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
});

// Button controls
muteButton.addEventListener('click', toggleMute);
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', togglePause);
clearScoreBtn.addEventListener("click", clearHighScore);
startButton.addEventListener('click', () => loadingPage(startGame));
restartButtons.forEach(btn => btn.addEventListener('click', () => loadingPage(restartGame)));