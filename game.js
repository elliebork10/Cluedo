// Game Setup Data
const SUSPECTS = ['Miss Scarlett', 'Colonel Mustard', 'Mrs. White', 'Mr. Green', 'Mrs. Peacock', 'Professor Plum'];
const WEAPONS = ['Candlestick', 'Dagger', 'Lead Pipe', 'Revolver', 'Rope', 'Wrench'];
const ROOMS = ['Kitchen', 'Ballroom', 'Conservatory', 'Dining Room', 'Billiard Room', 'Library', 'Lounge', 'Hall', 'Study'];

// Game State Variables
let confidentialEnvelope = {};
let players = [];
let turnIndex = 0;

// Utility function to shuffle an array
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Log actions to UI
function logMessage(msg) {
    const logBox = document.getElementById('game-log');
    const entry = document.createElement('p');
    entry.textContent = msg;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
}

// Initialize the game
function initGame() {
    logMessage("Initializing Clue...");

    // 1. Pick solution envelope
    const shufSuspects = shuffle(SUSPECTS);
    const shufWeapons = shuffle(WEAPONS);
    const shufRooms = shuffle(ROOMS);

    confidentialEnvelope = {
        suspect: shufSuspects.pop(),
        weapon: shufWeapons.pop(),
        room: shufRooms.pop()
    };

    // 2. Pool remaining cards and shuffle
    let deck = [...shufSuspects, ...shufWeapons, ...shufRooms];
    deck = shuffle(deck);

    // 3. Define players (User + 3 AI Opponents)
    players = [
        { name: 'You (Player)', isAI: false, hand: [] },
        { name: 'AI 1 (Mustard)', isAI: true, hand: [] },
        { name: 'AI 2 (Peacock)', isAI: true, hand: [] },
        { name: 'AI 3 (Plum)', isAI: true, hand: [] }
    ];

    // 4. Deal cards round-robin style
    let p = 0;
    while (deck.length > 0) {
        players[p].hand.push(deck.pop());
        p = (p + 1) % players.length;
    }

    logMessage("Cards dealt. Confidential envelope set!");
    renderPlayerHand();
}

// Display human player's hand on UI
function renderPlayerHand() {
    const list = document.getElementById('hand-list');
    list.innerHTML = '';
    players[0].hand.forEach(card => {
        const item = document.createElement('li');
        item.textContent = card;
        list.appendChild(item);
    });
}

// Start Game on load
window.onload = () => {
    initGame();
};