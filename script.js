// Game state variables
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' or 'ai'
let scores = { X: 0, O: 0, draw: 0 };

// Winning combinations
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// DOM elements
const cells = document.querySelectorAll('.cell');
const gameStatus = document.getElementById('gameStatus');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreDraw = document.getElementById('scoreDraw');
const playerOLabel = document.getElementById('playerOLabel');

// Sound effects (using Web Audio API for better browser compatibility)
let audioContext;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.log('Audio not supported');
    }
}

// Set game mode
function setGameMode(mode) {
    initAudio(); // Initialize audio on user interaction
    gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (mode === 'ai') {
        playerOLabel.textContent = '🤖 AI';
    } else {
        playerOLabel.textContent = 'Player O';
    }
    
    resetGame();
    playSound(800, 0.2);
}

// Make a move
function makeMove(index) {
    if (board[index] !== '' || !gameActive) return;

    initAudio(); // Initialize audio on user interaction
    
    // Play move sound
    playSound(600, 0.1);

    board[index] = currentPlayer;
    cells[index].textContent = currentPlayer === 'X' ? '❌' : '⭕';
    cells[index].classList.add(currentPlayer.toLowerCase());
    cells[index].disabled = true;

    // Add move animation
    cells[index].style.animation = 'cellPop 0.5s ease';

    if (checkWinner()) {
        gameActive = false;
        const winner = currentPlayer === 'X' ? '🏆 Player X Wins!' : 
                      gameMode === 'ai' && currentPlayer === 'O' ? '🤖 AI Wins!' : '🏆 Player O Wins!';
        gameStatus.textContent = winner;
        gameStatus.classList.add('winner-animation');
        scores[currentPlayer]++;
        updateScoreDisplay();
        highlightWinningCells();
        
        // Play win sound
        playWinSound();
        
        setTimeout(() => gameStatus.classList.remove('winner-animation'), 800);
        return;
    }

    if (board.every(cell => cell !== '')) {
        gameActive = false;
        gameStatus.textContent = "🤝 It's a Draw!";
        scores.draw++;
        updateScoreDisplay();
        
        // Play draw sound
        playSound(400, 0.5);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    
    if (gameMode === 'ai' && currentPlayer === 'O' && gameActive) {
        gameStatus.textContent = '🤖 AI is thinking...';
        // Add thinking animation
        gameStatus.style.animation = 'pulse 1s infinite';
        setTimeout(() => {
            makeAIMove();
            gameStatus.style.animation = '';
        }, Math.random() * 1000 + 500); // Random delay between 0.5-1.5s
    } else if (gameActive) {
        gameStatus.textContent = currentPlayer === 'X' ? '🔥 Player X\'s Turn' : '⚡ Player O\'s Turn';
    }
}

// AI move using minimax algorithm with difficulty levels
function makeAIMove() {
    let bestMove;
    
    // Add some randomness for more fun gameplay (30% chance of random move)
    if (Math.random() < 0.3 && getEmptySpaces().length > 6) {
        const emptySpaces = getEmptySpaces();
        bestMove = emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
    } else {
        bestMove = getBestMove();
    }
    
    makeMove(bestMove);
}

// Get empty spaces on the board
function getEmptySpaces() {
    return board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
}

// Get best move for AI using minimax
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = 0;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

// Minimax algorithm with alpha-beta pruning
function minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
    let winner = checkWinnerForMinimax();
    
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (board.every(cell => cell !== '')) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false, alpha, beta);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true, alpha, beta);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
        }
        return bestScore;
    }
}

// Check winner for minimax (returns winner or null)
function checkWinnerForMinimax() {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Check for winner
function checkWinner() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });
}

// Highlight winning cells with enhanced animation
function highlightWinningCells() {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            cells[a].classList.add('winning-cell');
            cells[b].classList.add('winning-cell');
            cells[c].classList.add('winning-cell');
            
            // Add sequential highlighting animation
            setTimeout(() => cells[a].style.transform = 'scale(1.1)', 100);
            setTimeout(() => cells[b].style.transform = 'scale(1.1)', 200);
            setTimeout(() => cells[c].style.transform = 'scale(1.1)', 300);
            
            break;
        }
    }
}

// Play win sound sequence
function playWinSound() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
    notes.forEach((note, index) => {
        setTimeout(() => {
            playSound(note, 0.3, 'triangle');
        }, index * 150);
    });
}

// Reset game with animation
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    gameStatus.textContent = "🔥 Player X's Turn";

    cells.forEach((cell, index) => {
        // Add reset animation
        setTimeout(() => {
            cell.textContent = '';
            cell.disabled = false;
            cell.classList.remove('x', 'o', 'winning-cell');
            cell.style.background = '';
            cell.style.transform = '';
            cell.style.animation = '';
        }, index * 50);
    });

    playSound(500, 0.2);
}

// Reset score with confirmation
function resetScore() {
    if (confirm('🔄 Are you sure you want to reset all scores?')) {
        scores = { X: 0, O: 0, draw: 0 };
        updateScoreDisplay();
        
        // Add score reset animation
        document.querySelectorAll('.score-value').forEach(score => {
            score.style.animation = 'cellPop 0.5s ease';
        });
        
        playSound(700, 0.3);
    }
}

// Update score display with animation
function updateScoreDisplay() {
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
    scoreDraw.textContent = scores.draw;
    
    // Add update animation
    [scoreX, scoreO, scoreDraw].forEach(score => {
        score.style.animation = 'cellPop 0.5s ease';
    });
}

// Add keyboard support
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    // Map number keys to cells (1-9)
    const keyMap = {
        '1': 0, '2': 1, '3': 2,
        '4': 3, '5': 4, '6': 5,
        '7': 6, '8': 7, '9': 8
    };
    
    if (keyMap.hasOwnProperty(e.key)) {
        makeMove(keyMap[e.key]);
    }
    
    // Reset game with 'R' key
    if (e.key.toLowerCase() === 'r') {
        resetGame();
    }
    
    // Switch game mode with 'M' key
    if (e.key.toLowerCase() === 'm') {
        const newMode = gameMode === 'pvp' ? 'ai' : 'pvp';
        const modeButtons = document.querySelectorAll('.mode-btn');
        const targetButton = newMode === 'ai' ? modeButtons[1] : modeButtons[0];
        
        // Simulate click on mode button
        targetButton.click();
    }
});

// Add pulse animation for thinking state
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Add touch support for mobile devices
cells.forEach((cell, index) => {
    cell.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent double-tap zoom
        makeMove(index);
    });
});

// Prevent context menu on long press for mobile
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    updateScoreDisplay();
    
    // Add welcome message
    console.log('🎮 Tic-Tac-Toe Game Loaded!');
    console.log('⌨️  Keyboard shortcuts:');
    console.log('   • Numbers 1-9: Make moves');
    console.log('   • R: Reset game');
    console.log('   • M: Switch game mode');
});

// Add window focus/blur handling for better mobile experience
window.addEventListener('blur', () => {
    if (audioContext && audioContext.state === 'running') {
        audioContext.suspend();
    }
});

window.addEventListener('focus', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}