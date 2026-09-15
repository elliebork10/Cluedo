// --- GAME CONSTANTS ---
const SUSPECTS = ['Miss Scarlett', 'Colonel Mustard', 'Mrs. White', 'Mr. Green', 'Mrs. Peacock', 'Professor Plum'];
const WEAPONS = ['Candlestick', 'Dagger', 'Lead Pipe', 'Revolver', 'Rope', 'Wrench'];
const ROOMS = ['Kitchen', 'Ballroom', 'Conservatory', 'Dining Room', 'Billiard Room', 'Library', 'Lounge', 'Hall', 'Study'];

// --- GAME STATE ---
let confidentialEnvelope = {};
let players = [];
let turnIndex = 0;
let gameActive = true;

// --- UTILITY FUNCTIONS ---
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function logMessage(msg) {
    const logBox = document.getElementById('game-log');
    const entry = document.createElement('p');
    entry.textContent = msg;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
}

// --- INITIALIZATION ---
function initGame() {
    logMessage("--- Welcome to Clue: Single Player Edition ---");

    // 1. Pick Confidential Envelope
    const shufSuspects = shuffle(SUSPECTS);
    const shufWeapons = shuffle(WEAPONS);
    const shufRooms = shuffle(ROOMS);

    confidentialEnvelope = {
        suspect: shufSuspects.pop(),
        weapon: shufWeapons.pop(),
        room: shufRooms.pop()
    };

    // 2. Pool & Shuffle Remaining Cards
    let deck = [...shufSuspects, ...shufWeapons, ...shufRooms];
    deck = shuffle(deck);

    // 3. Define Players & AI Memory tracking
    players = [
        { name: 'You (Player)', isAI: false, hand: [], active: true, memory: new Set() },
        { name: 'Colonel Mustard (AI)', isAI: true, hand: [], active: true, memory: new Set() },
        { name: 'Mrs. Peacock (AI)', isAI: true, hand: [], active: true, memory: new Set() },
        { name: 'Professor Plum (AI)', isAI: true, hand: [], active: true, memory: new Set() }
    ];

    // 4. Deal Cards Round-Robin
    let p = 0;
    while (deck.length > 0) {
        const card = deck.pop();
        players[p].hand.push(card);
        players[p].memory.add(card); // Players know their own cards
        p = (p + 1) % players.length;
    }

    // 5. Setup UI Components
    setupDropdowns();
    renderPlayerHand();
    buildDetectiveNotebook();

    logMessage("Cards dealt! Confidential envelope secured.");
    logMessage("Your turn! Make a suggestion, an accusation, or end your turn.");
}

// --- UI RENDERING ---
function setupDropdowns() {
    const sSelect = document.getElementById('suspect-select');
    const wSelect = document.getElementById('weapon-select');
    const rSelect = document.getElementById('room-select');

    const asSelect = document.getElementById('accuse-suspect-select');
    const awSelect = document.getElementById('accuse-weapon-select');
    const arSelect = document.getElementById('accuse-room-select');

    SUSPECTS.forEach(s => {
        sSelect.add(new Option(s, s));
        asSelect.add(new Option(s, s));
    });
    WEAPONS.forEach(w => {
        wSelect.add(new Option(w, w));
        awSelect.add(new Option(w, w));
    });
    ROOMS.forEach(r => {
        rSelect.add(new Option(r, r));
        arSelect.add(new Option(r, r));
    });
}

function renderPlayerHand() {
    const list = document.getElementById('hand-list');
    list.innerHTML = '';
    players[0].hand.forEach(card => {
        const item = document.createElement('li');
        item.textContent = card;
        list.appendChild(item);
    });
}

function buildDetectiveNotebook() {
    const renderCategory = (items, containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'notebook-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `nb-${item.replace(/\s+/g, '-')}`;
            
            // Auto-check cards held in human hand
            if (players[0].hand.includes(item)) {
                checkbox.checked = true;
            }

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = item;

            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
    };

    renderCategory(SUSPECTS, 'notebook-suspects');
    renderCategory(WEAPONS, 'notebook-weapons');
    renderCategory(ROOMS, 'notebook-rooms');
}

// --- GAMEPLAY CORE LOGIC ---
function handleSuggestion(suggesterIndex, suspect, weapon, room) {
    const suggester = players[suggesterIndex];
    logMessage(`${suggester.name} suggests: ${suspect} with the ${weapon} in the ${room}.`);

    let disproven = false;

    // Check remaining players in order to disprove
    for (let i = 1; i < players.length; i++) {
        const responderIndex = (suggesterIndex + i) % players.length;
        const responder = players[responderIndex];

        const matches = responder.hand.filter(card => 
            card === suspect || card === weapon || card === room
        );

        if (matches.length > 0) {
            const revealedCard = getRandomItem(matches);

            if (!suggester.isAI) {
                // Human player sees the card shown to them
                logMessage(`${responder.name} disproves the suggestion by showing you: ${revealedCard}`);
                suggester.memory.add(revealedCard);
                
                // Auto-check notebook for human convenience
                const checkbox = document.getElementById(`nb-${revealedCard.replace(/\s+/g, '-')}`);
                if (checkbox) checkbox.checked = true;
            } else {
                // AI player learns the card privately
                suggester.memory.add(revealedCard);
                logMessage(`${responder.name} showed a card to ${suggester.name}.`);
            }
            disproven = true;
            break;
        }
    }

    if (!disproven) {
        logMessage("No one could disprove the suggestion!");
    }

    return disproven;
}

function handleAccusation(accuserIndex, suspect, weapon, room) {
    const accuser = players[accuserIndex];
    logMessage(`🚨 ${accuser.name} makes an ACCUSATION: ${suspect} with the ${weapon} in the ${room}!`);

    const isCorrect = (
        suspect === confidentialEnvelope.suspect &&
        weapon === confidentialEnvelope.weapon &&
        room === confidentialEnvelope.room
    );

    if (isCorrect) {
        logMessage(`🎉 ACCUSATION CORRECT! ${accuser.name} solved the murder and WON THE GAME!`);
        logMessage(`Envelope contained: ${confidentialEnvelope.suspect}, ${confidentialEnvelope.weapon}, ${confidentialEnvelope.room}.`);
        gameActive = false;
        disableControls();
    } else {
        logMessage(`❌ INCORRECT! ${accuser.name} has been eliminated from making further accusations.`);
        accuser.active = false;

        // Check if human lost
        if (accuserIndex === 0) {
            logMessage(`Game Over! You were eliminated. Solution was: ${confidentialEnvelope.suspect}, ${confidentialEnvelope.weapon}, ${confidentialEnvelope.room}.`);
            gameActive = false;
            disableControls();
        } else {
            // Check if all active players are gone
            const activePlayers = players.filter(p => p.active);
            if (activePlayers.length === 0) {
                logMessage(`All players have been eliminated! Nobody wins. Solution was: ${confidentialEnvelope.suspect}, ${confidentialEnvelope.weapon}, ${confidentialEnvelope.room}.`);
                gameActive = false;
                disableControls();
            }
        }
    }
}

// --- TURN SYSTEM & AI LOGIC ---
function advanceTurn() {
    if (!gameActive) return;

    turnIndex = (turnIndex + 1) % players.length;
    const current = players[turnIndex];

    // Skip eliminated players
    if (!current.active) {
        advanceTurn();
        return;
    }

    logMessage(`--- ${current.name}'s Turn ---`);

    if (current.isAI) {
        setTimeout(() => executeAITurn(turnIndex), 1000);
    } else {
        logMessage("It's your turn! Select an action.");
    }
}

function executeAITurn(aiIndex) {
    if (!gameActive) return;

    const ai = players[aiIndex];

    // AI identifies unknown possibilities from memory
    const unknownSuspects = SUSPECTS.filter(s => !ai.memory.has(s));
    const unknownWeapons = WEAPONS.filter(w => !ai.memory.has(w));
    const unknownRooms = ROOMS.filter(r => !ai.memory.has(r));

    // Check if AI can make a winning accusation
    if (unknownSuspects.length === 1 && unknownWeapons.length === 1 && unknownRooms.length === 1) {
        handleAccusation(aiIndex, unknownSuspects[0], unknownWeapons[0], unknownRooms[0]);
        return;
    }

    // Otherwise, construct a suggestion using unverified cards (or random if all known)
    const sugSuspect = unknownSuspects.length > 0 ? getRandomItem(unknownSuspects) : getRandomItem(SUSPECTS);
    const sugWeapon = unknownWeapons.length > 0 ? getRandomItem(unknownWeapons) : getRandomItem(WEAPONS);
    const sugRoom = unknownRooms.length > 0 ? getRandomItem(unknownRooms) : getRandomItem(ROOMS);

    const disproven = handleSuggestion(aiIndex, sugSuspect, sugWeapon, sugRoom);

    // If suggestion wasn't disproven, AI learns those cards might be the envelope
    if (!disproven) {
        // AI retains suspicion
    }

    // End AI turn and hand over control
    setTimeout(advanceTurn, 1000);
}

function disableControls() {
    document.getElementById('end-turn-btn').disabled = true;
    document.getElementById('make-suggestion-btn').disabled = true;
    document.getElementById('accuse-btn').disabled = true;
}

// --- EVENT LISTENERS ---
document.getElementById('end-turn-btn').addEventListener('click', () => {
    if (!gameActive || turnIndex !== 0) return;
    advanceTurn();
});

document.getElementById('make-suggestion-btn').addEventListener('click', () => {
    if (!gameActive || turnIndex !== 0) return;
    document.getElementById('suggestion-modal').style.display = 'flex';
});

document.getElementById('cancel-suggestion-btn').addEventListener('click', () => {
    document.getElementById('suggestion-modal').style.display = 'none';
});

document.getElementById('submit-suggestion-btn').addEventListener('click', () => {
    const s = document.getElementById('suspect-select').value;
    const w = document.getElementById('weapon-select').value;
    const r = document.getElementById('room-select').value;

    document.getElementById('suggestion-modal').style.display = 'none';
    handleSuggestion(0, s, w, r);
});

document.getElementById('accuse-btn').addEventListener('click', () => {
    if (!gameActive || turnIndex !== 0) return;
    document.getElementById('accusation-modal').style.display = 'flex';
});

document.getElementById('cancel-accusation-btn').addEventListener('click', () => {
    document.getElementById('accusation-modal').style.display = 'none';
});

document.getElementById('submit-accusation-btn').addEventListener('click', () => {
    const s = document.getElementById('accuse-suspect-select').value;
    const w = document.getElementById('accuse-weapon-select').value;
    const r = document.getElementById('accuse-room-select').value;

    document.getElementById('accusation-modal').style.display = 'none';
    handleAccusation(0, s, w, r);
});

// Launch Game on Page Load
window.onload = initGame;