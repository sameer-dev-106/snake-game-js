// Board and modal elements selected from HTML
const board = document.querySelector('.board');
const modal = document.querySelector('.modal');
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const gamePauseModal = document.querySelector('.game-pause');

// Start and restart buttons
const startButton = document.querySelector('.btn-start');
const restartButton = document.querySelectorAll('.btn-restart');

// Game Levels buttons
const speedButtons = document.querySelectorAll("[data-speed]");

// Score and timer elements
const highScoreElement = document.querySelector('#high-score');
const scoreElement = document.querySelector('#score');
const timeElement = document.querySelector('#time');

// Each block size (used to calculate rows & columns)
const blockHeight = 30;
const blockWidth =30;

// Game state variables
let highScore = localStorage.getItem("highScore") || 0 ;
let score = 0;
let time = `00-00`;

highScoreElement.innerHTML = highScore;

// Calculate number of rows and columns dynamically
const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

let intervalId = null;
let timeIntervalId = null;

let direction = 'right';

let isPaused = false;

let food = {
    x: Math.floor(Math.random()*rows),
    y: Math.floor(Math.random()*cols)
};

let snake = [
    {
        x: 3,
        y: 4,
    },
];

// Store all blocks using "row-col" as key
const blocks = {};

// Create grid blocks dynamically
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);
        // block.innerText = `${row}-${col}`;
        blocks[`${row}-${col}`] = block;        
    }
};

// Defualt Speed  
let speed = 300;

speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove Class From All Button
        speedButtons.forEach(b => b.classList.remove('active'));
        // Adding class on Clicked Button
        btn.classList.add('active')
        // Set Speed Value From Clicked Button
        speed = Number(btn.dataset.speed);
    });
});

function renderSnake() {
    if (isPaused) return;
    // adding food on board
    blocks[`${food.x}-${food.y}`].classList.add('food');
    let head  = null;
    // set snakes directions
    if (direction === 'down') {
        head  = { x: snake[0].x + 1, y: snake[0].y }
    } else if (direction === 'up') {
        head  = { x: snake[0].x - 1, y: snake[0].y }
    } else if (direction === 'left') {
        head  = { x: snake[0].x, y: snake[0].y - 1 }
    } else if (direction === 'right') {
        head  = { x: snake[0].x, y: snake[0].y + 1 }
    }    
    // wall collision logic
    if (head .x < 0 || head .x >= rows || head .y < 0 || head .y >= cols) {
        showGameOver();
        return;
    }
    // Self collision
    if (snake.some(seg => seg.x === head .x && seg.y === head .y)) {
        showGameOver();
        return;
    }
    // Remove previous food safely
    if (head .x === food.x && head .y === food.y) {
        blocks[`${food.x}-${food.y}`].classList.remove('food')
        food = {
            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols)
        }

        blocks[`${food.x}-${food.y}`].classList.add('food')
        snake.push(head )

        score += 10;
        scoreElement.innerHTML = score

        if (score > highScore) {
            highScore = score
            localStorage.setItem('highScore', highScore)
        }
    }
    // Remove snake body safely
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('fill');
    });
    
    snake.unshift(head)
    snake.pop()
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.add('fill');
    });
};

startButton.addEventListener('click', startGame);

// restartButton.addEventListener('click', restartGame);
restartButton.forEach((btn) => {
    btn.addEventListener('click', restartGame);
})


function showGameOver() {
    clearInterval(intervalId);
    clearInterval(timeIntervalId);

    isPaused = false;

    modal.style.display = 'flex'
    startGameModal.style.display = 'none'
    gameOverModal.style.display = 'flex'
}

function timeCounter() {
    let [min, sec] = time.split('-').map(Number);
    
    if (sec === 59) {
        min += 1
        sec = 0
    } else {
        sec += 1
    }
    
    time = `${min}-${sec}`
    
    timeElement.innerHTML = time
}

function togglePause() {
    if (startGameModal.style.display !== 'none' || gameOverModal.style.display === 'flex') return;
    if(isPaused){
        // Resume game
        intervalId = setInterval(() => { renderSnake(); }, speed)
        timeIntervalId =setInterval(() => { timeCounter() }, 1000)
        isPaused = false;
        // hiding Pause/Resume Window
        modal.style.display = 'none'
        gamePauseModal.style.display = 'none';
    } else {
        // Pause game
        clearInterval(intervalId);
        clearInterval(timeIntervalId);
        isPaused = true;
        // Showing Pause/Resume Window
        modal.style.display = 'flex'
        startGameModal.style.display = 'none'
        gameOverModal.style.display = 'none'
        gamePauseModal.style.display = 'flex';
    }
}

function handleEnterAction() {
    if (startGameModal.style.display !== 'none') {
        startGame();
    } else if (gameOverModal.style.display !== 'none') {
        restartGame();
    } else if (gamePauseModal.style.display !==  'none') {
        togglePause(); // Resume or Pause
    }
}

function startGame() {
    modal.style.display = 'none';
    startGameModal.style.display = 'none';

    clearInterval(intervalId);
    clearInterval(timeIntervalId);

    intervalId = setInterval(() => { renderSnake() }, speed);
    timeIntervalId = setInterval(() => { timeCounter() }, 1000);

    isPaused = false;
}

function restartGame () {   
    showGameOver();

    isPaused = false;

    direction = 'right';

    if (blocks[`${food.x}-${food.y}`]){
        blocks[`${food.x}-${food.y}`].classList.remove('food')
    }

    snake.forEach(segment => {
        const block = blocks[`${segment.x}-${segment.y}`]
        if(block) block.classList.remove('fill');
    });

    score = 0;
    time = `00-00`

    scoreElement.innerHTML = score;
    timeElement.innerHTML = time;
    highScoreElement.innerHTML = highScore;

    modal.style.display = 'none'
    snake = [{
        x: Math.floor(Math.random() * rows),
        y: Math.floor(Math.random() * cols)
    }]

    food = {
        x: Math.floor(Math.random() * rows),
        y: Math.floor(Math.random() * cols)
    }
    blocks[`${food.x}-${food.y}`].classList.add('food')


    timeIntervalId = setInterval(() => { timeCounter() }, 1000);

    intervalId = setInterval(() => { renderSnake() }, speed);

}

addEventListener('keydown', (e) => {
    if (e.key === "ArrowUp" && direction !== 'down') return direction = 'up'
    if (e.key === 'ArrowDown' && direction !== 'up') return direction = 'down'
    if (e.key === 'ArrowLeft' && direction !== 'right') return direction = 'left'
    if (e.key === 'ArrowRight' && direction !== 'left') return direction = 'right'
    if (e.key === ' ') return togglePause(); 
    if(e.key === 'Enter') return handleEnterAction(); 
} );
