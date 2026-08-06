// --- SFX (Sistema de Audio Sintetizado) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, type, duration, vol=0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

const SFX = {
    flip: () => playTone(300, 'sine', 0.1, 0.05),
    match: () => {
        playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(600, 'sine', 0.2, 0.1), 100);
    },
    error: () => playTone(150, 'sawtooth', 0.3, 0.05),
    win: () => {
        playTone(400, 'square', 0.1, 0.1);
        setTimeout(() => playTone(500, 'square', 0.1, 0.1), 150);
        setTimeout(() => playTone(600, 'square', 0.1, 0.1), 300);
        setTimeout(() => playTone(800, 'square', 0.4, 0.1), 450);
    }
};

// --- Temáticas ---
const themes = {
    space: ['🚀', '👽', '🪐', '☄️', '🛸', '🛰️', '🧑‍🚀', '🌌', '⭐', '🌙', '🌞', '🌎'],
    food: ['🍔', '🍕', '🍣', '🌭', '🌮', '🍩', '🍦', '🍒', '🥑', '🍉', '🥐', '🍟'],
    animals: ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐒', '🐧', '🦉', '🐢', '🦄', '🐙']
};

// --- Estado del Juego ---
let grid = [];
let moves = 0;
let time = 0;
let timerInterval = null;
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairs = 0;
let totalPairs = 0;
let currentDifficulty = 16;

// --- DOM Elements ---
const board = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const restartBtn = document.getElementById('restart-btn');
const winModal = document.getElementById('win-modal');
const finalMovesEl = document.getElementById('final-moves');
const finalTimeEl = document.getElementById('final-time');
const playAgainBtn = document.getElementById('play-again-btn');

// Menu Elements
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const highScoreDisplay = document.getElementById('high-score-display');
const bestScoreText = document.getElementById('best-score-text');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');

// --- Sistema de Récords ---
function loadHighScore() {
    const record = localStorage.getItem(`memory_record_${currentDifficulty}`);
    if (record) {
        const data = JSON.parse(record);
        bestScoreText.innerText = `${data.time} (${data.moves} movs)`;
        highScoreDisplay.classList.remove('hidden');
    } else {
        highScoreDisplay.classList.add('hidden');
    }
}

difficultyRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentDifficulty = parseInt(e.target.value);
        loadHighScore();
    });
});

function saveHighScore() {
    const recordKey = `memory_record_${currentDifficulty}`;
    const currentRecord = localStorage.getItem(recordKey);
    const newRecord = { time: timeEl.innerText, moves: moves, rawTime: time };
    
    if (!currentRecord) {
        localStorage.setItem(recordKey, JSON.stringify(newRecord));
    } else {
        const parsedRecord = JSON.parse(currentRecord);
        // Si el tiempo es menor, o es igual pero con menos movimientos
        if (newRecord.rawTime < parsedRecord.rawTime || (newRecord.rawTime === parsedRecord.rawTime && newRecord.moves < parsedRecord.moves)) {
            localStorage.setItem(recordKey, JSON.stringify(newRecord));
        }
    }
}

// Inicializar el récord en pantalla al cargar
loadHighScore();

// --- Navegación ---
startBtn.addEventListener('click', () => {
    // Para activar el AudioContext en Safari/Chrome, debe ser desde un evento de usuario
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    currentDifficulty = parseInt(document.querySelector('input[name="difficulty"]:checked').value);
    
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    initGame(selectedTheme, currentDifficulty / 2);
});

backToMenuBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    gameScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    loadHighScore();
});

// --- Inicialización ---
function initGame(themeName = 'space', pairs = 8) {
    moves = 0; time = 0; matchedPairs = 0; totalPairs = pairs;
    hasFlippedCard = false; lockBoard = false; firstCard = null; secondCard = null;
    movesEl.innerText = '0'; timeEl.innerText = '00:00';
    winModal.classList.add('hidden');
    
    clearInterval(timerInterval); timerInterval = null;

    const selectedThemeArray = themes[themeName].slice(0, pairs);
    grid = [...selectedThemeArray, ...selectedThemeArray];

    shuffle(grid);
    renderBoard();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderBoard() {
    board.innerHTML = '';
    grid.forEach((symbol) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.symbol = symbol;
        
        card.innerHTML = `
            <div class="card-face card-front"></div>
            <div class="card-face card-back">${symbol}</div>
        `;
        
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });
}

// --- Lógica Principal ---
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    if (!timerInterval) startTimer();

    SFX.flip();
    this.classList.add('flipped');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    incrementMoves();
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {
        SFX.match();
        disableCards();
    } else {
        SFX.error();
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    matchedPairs++;
    
    if (matchedPairs === totalPairs) {
        endGame();
    }

    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function incrementMoves() {
    moves++;
    movesEl.innerText = moves;
}

function startTimer() {
    timerInterval = setInterval(() => {
        time++;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timeEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// --- Victoria ---
function endGame() {
    clearInterval(timerInterval);
    saveHighScore();
    
    setTimeout(() => SFX.win(), 300);
    fireConfetti();

    setTimeout(() => {
        finalMovesEl.innerText = moves;
        finalTimeEl.innerText = timeEl.innerText;
        winModal.classList.remove('hidden');
    }, 1000);
}

function fireConfetti() {
    if(typeof confetti !== 'undefined') {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2563eb', '#3b82f6', '#60a5fa'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2563eb', '#3b82f6', '#60a5fa'] });

            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

// --- Event Listeners Secundarios ---
restartBtn.addEventListener('click', () => {
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    initGame(selectedTheme, currentDifficulty / 2);
});

playAgainBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    gameScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    loadHighScore();
});
