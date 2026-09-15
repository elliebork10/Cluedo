// --- GAME CONSTANTS ---
const SUSPECTS = ['Miss Scarlett', 'Colonel Mustard', 'Mrs. White', 'Mr. Green', 'Mrs. Peacock', 'Professor Plum'];
const WEAPONS = ['Candlestick', 'Dagger', 'Lead Pipe', 'Revolver', 'Rope', 'Wrench'];
const ROOMS = ['Kitchen', 'Ballroom', 'Conservatory', 'Dining Room', 'Billiard Room', 'Library', 'Lounge', 'Hall', 'Study'];
const ALL_CARDS = [...SUSPECTS, ...WEAPONS, ...ROOMS];

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

    // 1. Secret Envelope Setup
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

    // 3. Define Players & AI Memory
    players = [
        { name: 'You (Player)', isAI: false, hand: [], active: true, eliminatedCards: new Set() },
        { name: 'Colonel Mustard (AI)', isAI: true, hand: [], active: true, eliminatedCards: new Set() },
        { name: 'Mrs. Peacock (AI)', isAI: true, hand: [], active: true, eliminatedCards: new Set() },
        { name: 'Professor Plum (AI)', isAI: true, hand: [], active: true, eliminatedCards: new Set() }
    ];

    // 4. Deal Cards Round-Robin
    let p = 0;
    while (deck.length > 0) {
        const card = deck.pop();
        players[p].hand.push(card);
        players[p].eliminatedCards.add(card); // Players eliminate cards held in their own hand
        p = (p + 1) % players.length;
    }

    // 5. Setup UI Components
    setupDropdowns();
    renderPlayerHand();
    buildMultiColumnNotebook();

    logMessage("Cards dealt! Confidential envelope secured.");
    logMessage("Smart AI opponents are actively tracking and solving the case.");
}

// --- UI SETUP ---
function setupDropdowns() {
    const sSelect = document.getElementById('suspect-select');
    const wSelect = document.getElementById('weapon-select');
    const rSelect = document.getElementById('room-select');

    const asSelect = document.getElementById('accuse-suspect-select');
    const awSelect = document.getElementById('accuse-weapon-select');
    const arSelect = document.getElementById('accuse-room-select');

    sSelect.innerHTML = ''; wSelect.innerHTML = ''; rSelect.innerHTML = '';
    asSelect.innerHTML = ''; awSelect.innerHTML = ''; arSelect.innerHTML = '';

    SUSPECTS.forEach(s => { sSelect.add(new Option(s, s)); asSelect.add(new Option(s, s)); });
    WEAPONS.forEach(w => { wSelect.add(new Option(w, w)); awSelect.add(new Option(w, w)); });
    ROOMS.forEach(r => { rSelect.add(new Option(r, r)); arSelect.add(new Option(r, r)); });
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

function buildMultiColumnNotebook() {
    const container = document.getElementById('notebook-rows');
    if (!container) return;
    container.innerHTML = '';

    const categories = [
        { title: 'Suspects', items: SUSPECTS },
        { title: 'Weapons', items: WEAPONS },
        { title: 'Rooms', items: ROOMS }
    ];

    categories.forEach(cat => {
        const catHeader = document.createElement('div');
        catHeader.className = 'notebook-category-title';
        catHeader.textContent = cat.title;
        container.appendChild(catHeader);

        cat.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'notebook-row';

            const nameLabel = document.createElement('span');
            nameLabel.textContent = item;
            row.appendChild(nameLabel);

            const safeId = item.replace(/\s+/g, '-');
            const userHasCard = players[0].hand.includes(item);

            ['shown', 'maybe', 'eliminated'].forEach(status => {
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `nb-${safeId}`;
                radio.value = status;

                if (userHasCard && status === 'shown') radio.checked = true;
                if (!userHasCard && status === 'maybe') radio.checked = true;

                row.appendChild(radio);
            });

            container.appendChild(row);
        });
    });
}

// --- SEQUENTIAL SUGGESTION & DISPROVING SYSTEM ---
function handleSuggestion(suggesterIndex, suspect, weapon, room) {
    const suggester = players[suggesterIndex];
    logMessage(`🔍 ${suggester.name} suggests: ${suspect} with ${weapon} in ${room}.`);

    let disproven = false;

    // Clockwise player evaluation
    for (let i = 1; i < players.length; i++) {
        const responderIndex = (suggesterIndex + i) % players.length;
        const responder = players[responderIndex];

        const matches = responder.hand.filter(card => card === suspect || card === weapon || card === room);

        if (matches.length > 0) {
            // Pick a matching card to reveal
            const chosenCard = getRandomItem(matches);

            if (suggesterIndex === 0) {
                // Human suggester sees exact card shown
                logMessage(`➡️ ${responder.name} has a card and reveals: ${chosenCard}`);
                suggester.eliminatedCards.add(chosenCard);
                autoCheckNotebook(chosenCard, 'shown');
            } else if (responderIndex === 0) {
                // Human is responder revealing to AI
                logMessage(`➡️ You showed a matching card to ${suggester.name}.`);
                suggester.eliminatedCards.add(chosenCard);
            } else {
                // AI reveals to AI
                logMessage(`➡️ ${responder.name} showed a card privately to ${suggester.name}.`);
                suggester.eliminatedCards.add(chosenCard);
            }

            disproven = true;
            break; // First matching player disproves; sequence ends
        } else {
            logMessage(`⏩ ${responder.name} has no matching cards and skips.`);
        }
    }

    if (!disproven) {
        logMessage(`❓ No one could disprove the suggestion!`);
    }
}

function autoCheckNotebook(cardName, statusValue) {
    const safeId = cardName.replace(/\s+/g, '-');
    const radios = document.getElementsByName(`nb-${safeId}`);
    radios.forEach(r => {
        if (r.value === statusValue) r.checked = true;
    });
}

// --- ACCUSATION SYSTEM ---
function handleAccusation(accuserIndex, suspect, weapon, room) {
    const accuser = players[accuserIndex];
    logMessage(`🚨 ${accuser.name} makes a FINAL ACCUSATION: ${suspect} with ${weapon} in ${room}!`);

    const isCorrect = (
        suspect === confidentialEnvelope.suspect &&
        weapon === confidentialEnvelope.weapon &&
        room === confidentialEnvelope.room
    );

    if (isCorrect) {
        logMessage(`🏆 CORRECT ACCUSATION! ${accuser.name} solved the murder and WON THE GAME!`);
        logMessage(`Confidential Envelope: ${confidentialEnvelope.suspect}, ${confidentialEnvelope.weapon}, ${confidentialEnvelope.room}.`);
        gameActive = false;
        disableControls();
    } else {
        logMessage(`❌ INCORRECT! ${accuser.name} is eliminated from making accusations.`);
        accuser.active = false;

        if (accuserIndex === 0) {
            logMessage(`Game Over! You were eliminated. Solution: ${confidentialEnvelope.suspect}, ${confidentialEnvelope.weapon}, ${confidentialEnvelope.room}.`);
            gameActive = false;
            disableControls();
        } else {
            const activePlayers = players.filter(p => p.active);
            if (activePlayers.length === 0) {
                logMessage(`All players eliminated! Solution: ${confidentialEnvelope.suspect}, ${confidentialEnvelope.weapon}, ${confidentialEnvelope.room}.`);
                gameActive = false;
                disableControls();
            }
        }
    }
}

// --- AI INTELLIGENCE ENGINE & TURN CYCLE ---
function advanceTurn() {
    if (!gameActive) return;

    turnIndex = (turnIndex + 1) % players.length;
    const current = players[turnIndex];

    if (!current.active) {
        advanceTurn();
        return;
    }

    logMessage(`\n--- ${current.name}'s Turn ---`);

    if (current.isAI) {
        setTimeout(() => executeAITurn(turnIndex), 1000);
    } else {
        logMessage("It's your turn! Make a suggestion, accusation, or pass.");
    }
}

function executeAITurn(aiIndex) {
    if (!gameActive) return;

    const ai = players[aiIndex];

    const getUnknowns = () => ({
        suspects: SUSPECTS.filter(s => !ai.eliminatedCards.has(s)),
        weapons: WEAPONS.filter(w => !ai.eliminatedCards.has(w)),
        rooms: ROOMS.filter(r => !ai.eliminatedCards.has(r))
    });

    let state = getUnknowns();

    // 1. Check if AI already knows the solution BEFORE making a suggestion
    if (state.suspects.length === 1 && state.weapons.length === 1 && state.rooms.length === 1) {
        handleAccusation(aiIndex, state.suspects[0], state.weapons[0], state.rooms[0]);
        return;
    }

    // 2. Make targeted suggestion
    const sugSuspect = state.suspects.length > 0 ? getRandomItem(state.suspects) : getRandomItem(SUSPECTS);
    const sugWeapon = state.weapons.length > 0 ? getRandomItem(state.weapons) : getRandomItem(WEAPONS);
    const sugRoom = state.rooms.length > 0 ? getRandomItem(state.rooms) : getRandomItem(ROOMS);

    handleSuggestion(aiIndex, sugSuspect, sugWeapon, sugRoom);

    // 3. Re-check knowledge IMMEDIATELY after suggestion completes
    state = getUnknowns();

    if (state.suspects.length === 1 && state.weapons.length === 1 && state.rooms.length === 1) {
        logMessage(`💡 ${ai.name} solved the case!`);
        setTimeout(() => {
            if (gameActive) {
                handleAccusation(aiIndex, state.suspects[0], state.weapons[0], state.rooms[0]);
            }
        }, 800);
        return;
    }

    setTimeout(advanceTurn, 1000);
}

function disableControls() {
    document.getElementById('end-turn-btn').disabled = true;
    document.getElementById('make-suggestion-btn').disabled = true;
    document.getElementById('accuse-btn').disabled = true;
}

// --- CONTROLS & LISTENERS ---
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

window.onload = initGame;