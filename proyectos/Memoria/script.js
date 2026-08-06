// --- Estado del Juego ---
const cardArray = ['🚀', '👽', '🪐', '☄️', '🛸', '🛰️', '🧑‍🚀', '🌌'];
let grid = [...cardArray, ...cardArray]; // Duplicar para crear pares
let moves = 0;
let time = 0;
let timerInterval = null;
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairs = 0;

// --- DOM Elements ---
const board = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const restartBtn = document.getElementById('restart-btn');
const winModal = document.getElementById('win-modal');
const finalMovesEl = document.getElementById('final-moves');
const finalTimeEl = document.getElementById('final-time');
const playAgainBtn = document.getElementById('play-again-btn');

// --- Inicialización ---
function initGame() {
    // Resetear variables
    moves = 0;
    time = 0;
    matchedPairs = 0;
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    movesEl.innerText = '0';
    timeEl.innerText = '00:00';
    winModal.classList.add('hidden');
    
    clearInterval(timerInterval);
    timerInterval = null;

    // Mezclar y renderizar
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
    grid.forEach((symbol, index) => {
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
    if (lockBoard) return; // Si estamos en delay de un error, no dejar hacer click
    if (this === firstCard) return; // No dejar clickear la misma carta dos veces

    // Iniciar temporizador al primer click
    if (!timerInterval) {
        startTimer();
    }

    this.classList.add('flipped');

    if (!hasFlippedCard) {
        // Primera vez que hace click
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // Segunda carta
    secondCard = this;
    incrementMoves();
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    // Es par
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    // Efecto visual de pareja encontrada
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    matchedPairs++;
    
    if (matchedPairs === cardArray.length) {
        endGame();
    }

    resetBoard();
}

function unflipCards() {
    // No es par
    lockBoard = true; // Bloqueamos la mesa para que vea su error
    
    // Añadimos pequeña vibración de error (opcional)
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

// --- Estadísticas y Temporizador ---
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
    
    // Disparar Confetti (Librería Canvas Confetti)
    fireConfetti();

    // Mostrar Modal después de un segundo
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
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

// --- Event Listeners ---
restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Arrancar
initGame();
