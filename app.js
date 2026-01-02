// Blackjack Strategy Helper App

// Game state
let gameState = {
    dealerCards: [],
    playerCards: [],
    currentBet: 1,
    bankroll: 1000,
    isSplit: false,
    splitHands: [], // Array of hands after splitting (can have multiple)
    splitHandResults: [], // null, 'win', 'loss', or 'push' for each hand
    isDoubled: false, // Track if current hand is doubled down
    splitHandDoubled: [], // Track if each split hand is doubled
    cardCounting: {
        runningCount: 0,
        cardsDealt: 0,
        initialDecks: 8,
        totalCards: 432 // 8 decks * 54 cards
    },
    stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalProfit: 0
    }
};

// Card counting values (Hi-Lo system)
const cardCountValues = {
    '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    '7': 0, '8': 0, '9': 0,
    '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
};

// Card values
const cardValues = {
    'A': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

// Card suits for display
const cardSuits = {
    'A': '♠', '2': '♠', '3': '♠', '4': '♠', '5': '♠', '6': '♠',
    '7': '♠', '8': '♠', '9': '♠', '10': '♠', 'J': '♠', 'Q': '♠', 'K': '♠'
};

// IndexedDB setup for saving statistics records
let db = null;
const DB_NAME = 'BlackjackStatsDB';
const DB_VERSION = 1;
const STORE_NAME = 'statistics';

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                objectStore.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

// Save statistics record to IndexedDB
async function saveStatsRecord(stats) {
    try {
        if (!db) {
            await initDB();
        }
        
        const now = new Date();
        const record = {
            timestamp: now.getTime(),
            date: now.toISOString().split('T')[0], // YYYY-MM-DD
            time: now.toLocaleTimeString(), // HH:MM:SS
            datetime: now.toLocaleString(), // Full date and time string
            gamesPlayed: stats.gamesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            pushes: stats.pushes || 0,
            totalProfit: stats.totalProfit,
            winRate: stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0
        };
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.add(record);
        
        console.log('Statistics record saved:', record);
        return record;
    } catch (error) {
        console.error('Error saving statistics record:', error);
        throw error;
    }
}

// Get all statistics records from IndexedDB
async function getAllStatsRecords() {
    try {
        if (!db) {
            await initDB();
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev'); // Sort by timestamp descending
            const records = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    records.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting statistics records:', error);
        return [];
    }
}

// Delete a statistics record
async function deleteStatsRecord(id) {
    try {
        if (!db) {
            await initDB();
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.delete(id);
        
        console.log('Statistics record deleted:', id);
        return true;
    } catch (error) {
        console.error('Error deleting statistics record:', error);
        return false;
    }
}

// Tab switching function
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
        button.classList.remove('text-white', 'border-green-400');
        button.classList.add('text-green-200', 'border-transparent');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`tab-content-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    // Add active class to selected tab button
    const selectedButton = document.getElementById(`tab-${tabName}`);
    if (selectedButton) {
        selectedButton.classList.add('active');
        selectedButton.classList.remove('text-green-200', 'border-transparent');
        selectedButton.classList.add('text-white', 'border-green-400');
    }
    
    // Load history if switching to history tab
    if (tabName === 'history') {
        loadStatsHistory();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    loadState();
    updateDisplay();
    // Don't load history on initial load, only when History tab is clicked
    // loadStatsHistory();
});

// Calculate hand value
function calculateHandValue(cards) {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
        if (card === 'A') {
            aces++;
            value += 11;
        } else {
            value += cardValues[card];
        }
    }
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    
    return value;
}

// Check if hand is soft (contains ace counted as 11)
function isSoftHand(cards) {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
        if (card === 'A') {
            aces++;
            value += 11;
        } else {
            value += cardValues[card];
        }
    }
    
    return aces > 0 && value <= 21;
}

// Get basic strategy recommendation
function getStrategyRecommendation(playerCards, dealerCard) {
    if (playerCards.length === 0 || dealerCard === null) {
        return { action: 'wait', message: 'Add cards to get recommendations' };
    }
    
    const playerValue = calculateHandValue(playerCards);
    const dealerValue = cardValues[dealerCard] === 11 ? 11 : cardValues[dealerCard];
    const isSoft = isSoftHand(playerCards);
    const canDouble = playerCards.length === 2;
    const canSplit = playerCards.length === 2 && playerCards[0] === playerCards[1];
    
    // Insurance recommendation based on True Count
    // Insurance is recommended when dealer shows Ace and True Count >= 3
    if (dealerCard === 'A' && playerCards.length === 2) {
        const trueCount = calculateTrueCount();
        if (trueCount >= 3) {
            return { 
                action: 'insurance', 
                message: 'BUY INSURANCE 🛡️', 
                color: 'text-blue-400',
                details: `True Count ${trueCount.toFixed(1)} >= 3: Insurance is profitable`
            };
        } else {
            return { 
                action: 'no-insurance', 
                message: 'NO INSURANCE ❌', 
                color: 'text-red-300',
                details: `True Count ${trueCount.toFixed(1)} < 3: Insurance is not profitable`
            };
        }
    }
    
    // Blackjack!
    if (playerCards.length === 2 && playerValue === 21) {
        return { action: 'blackjack', message: 'BLACKJACK! 🎉', color: 'text-yellow-300' };
    }
    
    // Bust
    if (playerValue > 21) {
        return { action: 'bust', message: 'BUST! 💥', color: 'text-red-400' };
    }
    
    // Pair splitting strategy
    if (canSplit) {
        const pairValue = playerCards[0];
        if (pairValue === 'A' || pairValue === '8') {
            return { action: 'split', message: 'SPLIT', color: 'text-purple-300', details: 'Always split Aces and 8s' };
        }
        if (pairValue === '10' || pairValue === 'J' || pairValue === 'Q' || pairValue === 'K') {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Never split 10s' };
        }
        if (pairValue === '9') {
            if (dealerValue >= 2 && dealerValue <= 6 && dealerValue !== 8 && dealerValue !== 9) {
                return { action: 'split', message: 'SPLIT', color: 'text-purple-300', details: 'Split 9s vs 2-6, 8, 9' };
            }
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300' };
        }
        if (pairValue === '7') {
            if (dealerValue >= 2 && dealerValue <= 7) {
                return { action: 'split', message: 'SPLIT', color: 'text-purple-300', details: 'Split 7s vs 2-7' };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300' };
        }
        if (pairValue === '6') {
            if (dealerValue >= 2 && dealerValue <= 6) {
                return { action: 'split', message: 'SPLIT', color: 'text-purple-300', details: 'Split 6s vs 2-6' };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300' };
        }
        if (pairValue === '5') {
            if (dealerValue >= 2 && dealerValue <= 9) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double 5s vs 2-9' };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300' };
        }
        if (pairValue === '4') {
            if (dealerValue >= 5 && dealerValue <= 6) {
                return { action: 'split', message: 'SPLIT', color: 'text-purple-300', details: 'Split 4s vs 5-6' };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300' };
        }
        if (pairValue === '3' || pairValue === '2') {
            if (dealerValue >= 4 && dealerValue <= 7) {
                return { action: 'split', message: 'SPLIT', color: 'text-purple-300', details: 'Split 2s/3s vs 4-7' };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300' };
        }
    }
    
    // Soft hands (Ace counted as 11)
    if (isSoft && playerCards.includes('A')) {
        const nonAceValue = playerCards.filter(c => c !== 'A').reduce((sum, c) => sum + cardValues[c], 0);
        
        if (playerValue === 21) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Soft 21' };
        }
        if (playerValue === 20) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Always stand on soft 20' };
        }
        if (playerValue === 19) {
            if (dealerValue === 6 && canDouble) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double soft 19 vs 6' };
            }
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on soft 19' };
        }
        if (playerValue === 18) {
            if (dealerValue >= 2 && dealerValue <= 6 && canDouble) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double soft 18 vs 2-6' };
            }
            if (dealerValue >= 9 && dealerValue <= 11) {
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit soft 18 vs 9-A' };
            }
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300' };
        }
        if (playerValue === 17) {
            if (dealerValue >= 3 && dealerValue <= 6 && canDouble) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double soft 17 vs 3-6' };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit soft 17' };
        }
        if (playerValue >= 13 && playerValue <= 16) {
            if (dealerValue >= 4 && dealerValue <= 6 && canDouble) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double soft 13-16 vs 4-6' };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit soft 13-16' };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit soft hands below 13' };
    }
    
    // Hard hands
    if (playerValue >= 17) {
        return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Always stand on 17+' };
    }
    if (playerValue === 16) {
        if (dealerValue >= 2 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 16 vs 2-6' };
        }
        // Card counting adjustment: Hard 16 vs 10, stand if TC >= 1
        if (dealerValue === 10 && !isSoft) {
            const trueCount = calculateTrueCount();
            if (trueCount >= 1) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 16 vs 10: Stand (TC ${trueCount.toFixed(1)} >= 1)` };
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 16 vs 7-A' };
    }
    if (playerValue === 15) {
        if (dealerValue >= 2 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 15 vs 2-6' };
        }
        // Card counting adjustments for Hard 15
        if (!isSoft) {
            const trueCount = calculateTrueCount();
            // Hard 15 vs 10, stand if TC >= 4
            if (dealerValue === 10) {
                if (trueCount >= 4) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 15 vs 10: Stand (TC ${trueCount.toFixed(1)} >= 4)` };
                }
            }
            // Hard 15 vs 9, stand if TC >= 2
            if (dealerValue === 9) {
                if (trueCount >= 2) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 15 vs 9: Stand (TC ${trueCount.toFixed(1)} >= 2)` };
                }
            }
            // Hard 15 vs A, stand if TC >= 1
            if (dealerValue === 11) { // Ace is 11
                if (trueCount >= 1) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 15 vs A: Stand (TC ${trueCount.toFixed(1)} >= 1)` };
                }
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 15 vs 7-A' };
    }
    if (playerValue === 14) {
        if (dealerValue >= 2 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 14 vs 2-6' };
        }
        // Card counting adjustment: Hard 14 vs 10, stand if TC >= 3
        if (dealerValue === 10 && !isSoft) {
            const trueCount = calculateTrueCount();
            if (trueCount >= 3) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 14 vs 10: Stand (TC ${trueCount.toFixed(1)} >= 3)` };
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 14 vs 7-A' };
    }
    if (playerValue === 13) {
        // Card counting adjustment: Hard 13 vs 2, stand if TC >= -1
        if (dealerValue === 2 && !isSoft) {
            const trueCount = calculateTrueCount();
            if (trueCount >= -1) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 13 vs 2: Stand (TC ${trueCount.toFixed(1)} >= -1)` };
            }
            return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 13 vs 2: Hit (TC ${trueCount.toFixed(1)} < -1)` };
        }
        if (dealerValue >= 2 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 13 vs 2-6' };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 13 vs 7-A' };
    }
    if (playerValue === 12) {
        // Card counting adjustments for Hard 12
        if (!isSoft) {
            const trueCount = calculateTrueCount();
            // Hard 12 vs 2/3, stand if TC >= 2
            if (dealerValue === 2 || dealerValue === 3) {
                if (trueCount >= 2) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs ${dealerValue}: Stand (TC ${trueCount.toFixed(1)} >= 2)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 12 vs ${dealerValue}: Hit (TC ${trueCount.toFixed(1)} < 2)` };
            }
            // Hard 12 vs 4, stand if TC >= 3 (otherwise hit)
            if (dealerValue === 4) {
                if (trueCount >= 3) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs 4: Stand (TC ${trueCount.toFixed(1)} >= 3)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 12 vs 4: Hit (TC ${trueCount.toFixed(1)} < 3)` };
            }
            // Hard 12 vs 5, stand if TC >= 1 (otherwise hit)
            if (dealerValue === 5) {
                if (trueCount >= 1) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs 5: Stand (TC ${trueCount.toFixed(1)} >= 1)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 12 vs 5: Hit (TC ${trueCount.toFixed(1)} < 1)` };
            }
            // Hard 12 vs 6, stand if TC >= -1 (otherwise hit)
            if (dealerValue === 6) {
                if (trueCount >= -1) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs 6: Stand (TC ${trueCount.toFixed(1)} >= -1)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 12 vs 6: Hit (TC ${trueCount.toFixed(1)} < -1)` };
            }
        }
        // Basic strategy: Stand on 12 vs 4-6 (if not hard hand or no adjustments apply)
        if (dealerValue >= 4 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 12 vs 4-6' };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 12 vs 2-3, 7-A' };
    }
    if (playerValue === 11) {
        if (canDouble) {
            // Card counting adjustment: Hard 11 vs A, double if TC >= 1 (otherwise hit)
            if (dealerValue === 11 && !isSoft) { // Ace is 11
                const trueCount = calculateTrueCount();
                if (trueCount >= 1) {
                    return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 11 vs A: Double (TC ${trueCount.toFixed(1)} >= 1)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 11 vs A: Hit (TC ${trueCount.toFixed(1)} < 1)` };
            }
            // Basic strategy: Always double 11 vs other cards
            return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Always double 11' };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 11 (can\'t double)' };
    }
    if (playerValue === 10) {
        if (canDouble) {
            // Card counting adjustments for Hard 10
            if (!isSoft) {
                const trueCount = calculateTrueCount();
                // Hard 10 vs 10, double if TC >= 4
                if (dealerValue === 10) {
                    if (trueCount >= 4) {
                        return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 10 vs 10: Double (TC ${trueCount.toFixed(1)} >= 4)` };
                    }
                    return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 10 vs 10: Hit (TC ${trueCount.toFixed(1)} < 4)` };
                }
                // Hard 10 vs A, double if TC >= 4
                if (dealerValue === 11) { // Ace is 11
                    if (trueCount >= 4) {
                        return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 10 vs A: Double (TC ${trueCount.toFixed(1)} >= 4)` };
                    }
                    return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 10 vs A: Hit (TC ${trueCount.toFixed(1)} < 4)` };
                }
            }
            // Basic strategy: Double 10 vs 2-9
            if (dealerValue >= 2 && dealerValue <= 9) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double 10 vs 2-9' };
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 10' };
    }
    if (playerValue === 9) {
        if (canDouble) {
            // Card counting adjustment: Hard 9 vs 2, double if TC >= 1
            if (dealerValue === 2 && !isSoft) {
                const trueCount = calculateTrueCount();
                if (trueCount >= 1) {
                    return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 9 vs 2: Double (TC ${trueCount.toFixed(1)} >= 1)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 9 vs 2: Hit (TC ${trueCount.toFixed(1)} < 1)` };
            }
            // Basic strategy: Double 9 vs 3-6
            if (dealerValue >= 3 && dealerValue <= 6) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double 9 vs 3-6' };
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 9' };
    }
    
    // Always hit on 8 or less
    return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Always hit on 8 or less' };
}

// Add card to hand
function addCard(hand, card) {
    try {
        if (hand === 'dealer') {
            gameState.dealerCards.push(card);
        } else if (hand === 'player') {
            if (gameState.isSplit) {
                // Determine which split hand to add to (first incomplete hand)
                let minLength = Infinity;
                let targetIndex = 0;
                for (let i = 0; i < gameState.splitHands.length; i++) {
                    if (gameState.splitHandResults[i] === null && gameState.splitHands[i].length < minLength) {
                        minLength = gameState.splitHands[i].length;
                        targetIndex = i;
                    }
                }
                gameState.splitHands[targetIndex].push(card);
            } else {
                gameState.playerCards.push(card);
            }
        } else if (hand && hand.startsWith('split-')) {
            // Add to specific split hand (split-0, split-1, etc.)
            const handIndex = parseInt(hand.split('-')[1]);
            if (!isNaN(handIndex) && handIndex >= 0 && handIndex < gameState.splitHands.length) {
                gameState.splitHands[handIndex].push(card);
            }
        }
        
        // Update card counting
        if (card && typeof updateCardCount === 'function') {
            updateCardCount(card, 'add');
        }
        
        updateDisplay();
        saveState();
    } catch (error) {
        console.error('Error adding card:', error);
        // Still update display even if card counting fails
        updateDisplay();
    }
}

// Update card count
function updateCardCount(card, action) {
    try {
        // Ensure cardCounting exists
        if (!gameState.cardCounting) {
            gameState.cardCounting = {
                runningCount: 0,
                cardsDealt: 0,
                initialDecks: 8,
                totalCards: 432
            };
        }
        
        const countValue = cardCountValues[card] || 0;
        
        if (action === 'add') {
            gameState.cardCounting.runningCount += countValue;
            gameState.cardCounting.cardsDealt++;
        } else if (action === 'remove') {
            gameState.cardCounting.runningCount -= countValue;
            gameState.cardCounting.cardsDealt = Math.max(0, gameState.cardCounting.cardsDealt - 1);
        }
    } catch (error) {
        console.error('Error updating card count:', error);
    }
}

// Calculate True Count
function calculateTrueCount() {
    const cardsRemaining = gameState.cardCounting.totalCards - gameState.cardCounting.cardsDealt;
    const decksRemaining = cardsRemaining / 54;
    
    if (decksRemaining <= 0) {
        return 0;
    }
    
    return Math.round((gameState.cardCounting.runningCount / decksRemaining) * 10) / 10; // Round to 1 decimal
}

// Get suggested bet based on True Count
function getSuggestedBet(trueCount) {
    const baseBet = 1; // Minimum bet
    
    if (trueCount <= 0) {
        return { bet: baseBet, message: 'Negative count - bet minimum', color: 'text-red-300' };
    } else if (trueCount <= 1) {
        return { bet: baseBet, message: 'Low count - bet minimum', color: 'text-yellow-300' };
    } else if (trueCount <= 2) {
        return { bet: baseBet * 2, message: 'Slightly positive - bet 2x', color: 'text-green-300' };
    } else if (trueCount <= 3) {
        return { bet: baseBet * 4, message: 'Positive count - bet 4x', color: 'text-green-400' };
    } else if (trueCount <= 4) {
        return { bet: baseBet * 6, message: 'Good count - bet 6x', color: 'text-green-500' };
    } else if (trueCount <= 5) {
        return { bet: baseBet * 8, message: 'Very good count - bet 8x', color: 'text-green-600' };
    } else {
        return { bet: baseBet * 10, message: 'Excellent count - bet 10x', color: 'text-green-700' };
    }
}

// Get effective bet (current bet or suggested bet based on checkbox)
function getEffectiveBet() {
    const useSuggestedBet = document.getElementById('useSuggestedBet');
    if (useSuggestedBet && useSuggestedBet.checked) {
        const trueCount = calculateTrueCount();
        const suggestedBet = getSuggestedBet(trueCount);
        return suggestedBet.bet;
    }
    return gameState.currentBet;
}

// Reset card counting
function resetCardCount() {
    gameState.cardCounting.runningCount = 0;
    gameState.cardCounting.cardsDealt = 0;
    updateDisplay();
    saveState();
}

    // Clear hand
function clearHand(hand) {
    // Recalculate count by removing all cards from this hand
    if (hand === 'dealer') {
        gameState.dealerCards.forEach(card => updateCardCount(card, 'remove'));
        gameState.dealerCards = [];
    } else if (hand === 'player') {
        gameState.playerCards.forEach(card => updateCardCount(card, 'remove'));
        gameState.playerCards = [];
        gameState.isSplit = false;
        gameState.splitHands.forEach(splitHand => {
            splitHand.forEach(card => updateCardCount(card, 'remove'));
        });
        gameState.splitHands = [];
        gameState.splitHandResults = [];
        gameState.isDoubled = false;
        gameState.splitHandDoubled = [];
    } else if (hand.startsWith('split-')) {
        const handIndex = parseInt(hand.split('-')[1]);
        gameState.splitHands[handIndex].forEach(card => updateCardCount(card, 'remove'));
        gameState.splitHands[handIndex] = [];
        gameState.splitHandResults[handIndex] = null;
        gameState.splitHandDoubled[handIndex] = false;
    }
    updateDisplay();
    saveState();
}

// Remove card (click to remove)
function removeCard(hand, index) {
    let removedCard = null;
    
    if (hand === 'dealer') {
        removedCard = gameState.dealerCards[index];
        gameState.dealerCards.splice(index, 1);
    } else if (hand === 'player') {
        if (gameState.isSplit) {
            // Find which split hand contains this card
            let cardCount = 0;
            for (let i = 0; i < gameState.splitHands.length; i++) {
                if (index < cardCount + gameState.splitHands[i].length) {
                    const adjustedIndex = index - cardCount;
                    removedCard = gameState.splitHands[i][adjustedIndex];
                    gameState.splitHands[i].splice(adjustedIndex, 1);
                    break;
                }
                cardCount += gameState.splitHands[i].length;
            }
        } else {
            removedCard = gameState.playerCards[index];
            gameState.playerCards.splice(index, 1);
        }
    } else if (hand.startsWith('split-')) {
        const handIndex = parseInt(hand.split('-')[1]);
        if (handIndex >= 0 && handIndex < gameState.splitHands.length) {
            removedCard = gameState.splitHands[handIndex][index];
            gameState.splitHands[handIndex].splice(index, 1);
        }
    }
    
    // Update card counting
    if (removedCard) {
        updateCardCount(removedCard, 'remove');
    }
    
    updateDisplay();
    saveState();
}

// Split function - can split initial pair or any split hand
function splitHand(handIndex = null) {
    // If handIndex is provided, split a specific split hand
    if (handIndex !== null && gameState.isSplit) {
        const hand = gameState.splitHands[handIndex];
        if (hand && hand.length === 2 && hand[0] === hand[1] && gameState.splitHandResults[handIndex] === null) {
            // Split this hand into two
            const card = hand[0];
            gameState.splitHands[handIndex] = [card];
            gameState.splitHands.push([card]);
            gameState.splitHandResults.push(null);
            gameState.splitHandDoubled.push(false);
            updateDisplay();
            saveState();
        }
        return;
    }
    
    // Split initial pair
    if (gameState.playerCards.length === 2 && gameState.playerCards[0] === gameState.playerCards[1]) {
        gameState.isSplit = true;
        gameState.splitHands = [[gameState.playerCards[0]], [gameState.playerCards[1]]];
        // Cards are already counted, no need to recount
        gameState.playerCards = [];
        gameState.splitHandResults = [null, null];
        gameState.splitHandDoubled = [false, false];
        updateDisplay();
        saveState();
    }
}

// Update display
function updateDisplay() {
    // Update dealer cards
    const dealerCardsDiv = document.getElementById('dealerCards');
    dealerCardsDiv.innerHTML = '';
    if (gameState.dealerCards.length === 0) {
        dealerCardsDiv.innerHTML = '<div class="text-green-200 text-sm">Click cards to add</div>';
    } else {
        gameState.dealerCards.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card ' + (card === 'A' || card === 'J' || card === 'Q' || card === 'K' ? 'red' : 'black');
            
            const cardValue = document.createElement('div');
            cardValue.className = 'card-value';
            cardValue.textContent = card;
            cardDiv.appendChild(cardValue);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'card-remove-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeCard('dealer', index);
            };
            cardDiv.appendChild(removeBtn);
            
            dealerCardsDiv.appendChild(cardDiv);
        });
    }
    
    // Update player cards - handle split mode
    const playerCardsDiv = document.getElementById('playerCards');
    playerCardsDiv.innerHTML = '';
    
    if (gameState.isSplit) {
        // Display split hands
        gameState.splitHands.forEach((hand, handIndex) => {
            const handContainer = document.createElement('div');
            handContainer.className = 'mb-4';
            
            const handValue = calculateHandValue(hand);
            const handLabel = document.createElement('div');
            handLabel.className = 'text-green-200 text-sm mb-2 font-semibold';
            let labelText = `Hand ${handIndex + 1} (Value: ${handValue})`;
            if (gameState.splitHandDoubled[handIndex]) {
                labelText += ' 💰 DOUBLED';
            }
            if (gameState.splitHandResults[handIndex]) {
                labelText += ' - ' + gameState.splitHandResults[handIndex].toUpperCase();
            }
            handLabel.textContent = labelText;
            handContainer.appendChild(handLabel);
            
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'flex flex-wrap gap-2 mb-2';
            
            if (hand.length === 0) {
                cardsContainer.innerHTML = '<div class="text-green-200 text-xs">Add cards</div>';
            } else {
                hand.forEach((card, index) => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card ' + (card === 'A' || card === 'J' || card === 'Q' || card === 'K' ? 'red' : 'black');
                    
                    const cardValue = document.createElement('div');
                    cardValue.className = 'card-value';
                    cardValue.textContent = card;
                    cardDiv.appendChild(cardValue);
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'card-remove-btn';
                    removeBtn.textContent = '×';
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        removeCard('split-' + handIndex, index);
                    };
                    cardDiv.appendChild(removeBtn);
                    
                    cardsContainer.appendChild(cardDiv);
                });
            }
            
            
            handContainer.appendChild(cardsContainer);
            
            // Add card selection buttons for this split hand
            const cardButtonsContainer = document.createElement('div');
            cardButtonsContainer.className = 'flex gap-1.5 mb-2';
            const cardButtons = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            cardButtons.forEach(card => {
                const btn = document.createElement('button');
                btn.className = card === 'A' ? 'card-btn bg-red-600 hover:bg-red-700' : 'card-btn';
                btn.textContent = card;
                btn.onclick = () => addCard('split-' + handIndex, card);
                cardButtonsContainer.appendChild(btn);
            });
            handContainer.appendChild(cardButtonsContainer);
            
            // Add split button if hand has a pair and can be split
            if (hand.length === 2 && hand[0] === hand[1] && !gameState.splitHandResults[handIndex]) {
                const splitButton = document.createElement('button');
                splitButton.className = 'w-full bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-semibold mb-2';
                splitButton.textContent = '✂️ Split Hand ' + (handIndex + 1);
                splitButton.onclick = () => splitHand(handIndex);
                handContainer.appendChild(splitButton);
            }
            
            // Add double down button for split hands if recommendation is double and not already doubled
            if (hand.length === 2 && !gameState.splitHandDoubled[handIndex] && !gameState.splitHandResults[handIndex]) {
                const dealerCard = gameState.dealerCards.length > 0 ? gameState.dealerCards[0] : null;
                const strategy = getStrategyRecommendation(hand, dealerCard);
                if (strategy.action === 'double') {
                    const doubleButton = document.createElement('button');
                    doubleButton.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold mb-2';
                    doubleButton.textContent = '💰 Double Down';
                    doubleButton.onclick = () => doubleDownSplit(handIndex);
                    handContainer.appendChild(doubleButton);
                }
            }
            
            // Show doubled indicator if already doubled
            if (gameState.splitHandDoubled[handIndex]) {
                const doubledIndicator = document.createElement('div');
                doubledIndicator.className = 'mb-2 p-2 bg-blue-500/20 border border-blue-400 rounded';
                doubledIndicator.innerHTML = `
                    <div class="text-blue-300 font-semibold text-center text-xs">💰 Doubled</div>
                    <div class="text-blue-200 text-xs text-center">Bet: $${gameState.currentBet * 2}</div>
                `;
                handContainer.appendChild(doubledIndicator);
            }
            
            // Add result buttons if hand has cards
            if (hand.length > 0 && !gameState.splitHandResults[handIndex]) {
                const resultButtons = document.createElement('div');
                resultButtons.className = 'flex gap-1 mb-2';
                resultButtons.innerHTML = `
                    <button onclick="recordSplitResult(${handIndex}, 'win')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold">Win</button>
                    <button onclick="recordSplitResult(${handIndex}, 'push')" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs font-semibold">Push</button>
                    <button onclick="recordSplitResult(${handIndex}, 'loss')" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold">Loss</button>
                `;
                handContainer.appendChild(resultButtons);
            }
            
            playerCardsDiv.appendChild(handContainer);
        });
    } else {
        // Normal mode - single hand
        if (gameState.playerCards.length === 0) {
            playerCardsDiv.innerHTML = '<div class="text-green-200 text-sm">Click cards to add</div>';
        } else {
            gameState.playerCards.forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card ' + (card === 'A' || card === 'J' || card === 'Q' || card === 'K' ? 'red' : 'black');
                
                const cardValue = document.createElement('div');
                cardValue.className = 'card-value';
                cardValue.textContent = card;
                cardDiv.appendChild(cardValue);
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'card-remove-btn';
                removeBtn.textContent = '×';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeCard('player', index);
                };
                cardDiv.appendChild(removeBtn);
                
                playerCardsDiv.appendChild(cardDiv);
            });
        }
    }
    
    // Update values
    const dealerValue = calculateHandValue(gameState.dealerCards);
    let playerValue = 0;
    if (gameState.isSplit) {
        // Show combined value or individual values
        playerValue = gameState.splitHands.map(h => calculateHandValue(h)).join(' / ');
    } else {
        playerValue = calculateHandValue(gameState.playerCards);
    }
    document.getElementById('dealerValue').textContent = dealerValue;
    document.getElementById('playerValue').textContent = playerValue;
    
    // Update strategy
    const dealerCard = gameState.dealerCards.length > 0 ? gameState.dealerCards[0] : null;
    const strategyDisplay = document.getElementById('strategyDisplay');
    const strategyDetails = document.getElementById('strategyDetails');
    
    if (gameState.isSplit) {
        // Show separate strategies for each split hand
        let strategyHTML = '<div class="space-y-4">';
        
        gameState.splitHands.forEach((hand, handIndex) => {
            const strategy = getStrategyRecommendation(hand, dealerCard);
            const handResult = gameState.splitHandResults[handIndex];
            const isDoubled = gameState.splitHandDoubled[handIndex];
            
            let handHTML = `
                <div class="bg-white/5 rounded-lg p-2 border border-white/10">
                    <div class="text-green-200 text-xs font-semibold mb-1">Hand ${handIndex + 1}${isDoubled ? ' 💰 DOUBLED' : ''}${handResult ? ' - ' + handResult.toUpperCase() : ''}</div>
                    <div class="flex items-center justify-center gap-2 mb-1">
                        <div class="text-2xl">${getActionEmoji(strategy.action)}</div>
                        <div class="text-lg font-bold ${strategy.color || 'text-white'}">${strategy.message}</div>
                    </div>
            `;
            
            // Add split button if hand has a pair and can be split
            if (strategy.action === 'split' && hand.length === 2 && hand[0] === hand[1] && handResult === null) {
                handHTML += `
                    <button onclick="splitHand(${handIndex})" class="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                        ✂️ Split Hand ${handIndex + 1}
                    </button>
                `;
            }
            
            // Add double down button for split hands if recommendation is double
            if (strategy.action === 'double' && !isDoubled && hand.length === 2 && handResult === null) {
                handHTML += `
                    <button onclick="doubleDownSplit(${handIndex})" class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                        💰 Double Down Hand ${handIndex + 1}
                    </button>
                `;
            }
            
            if (isDoubled) {
                handHTML += `
                    <div class="mt-2 p-2 bg-blue-500/20 border border-blue-400 rounded">
                        <div class="text-blue-300 font-semibold text-center text-xs">💰 Doubled</div>
                        <div class="text-blue-200 text-xs text-center">Bet: $${gameState.currentBet * 2}</div>
                    </div>
                `;
            }
            
            handHTML += `${strategy.details ? `<div class="text-center text-green-200 text-xs mt-2">${strategy.details}</div>` : ''}</div>`;
            strategyHTML += handHTML;
        });
        
        strategyHTML += '</div>';
        strategyDisplay.innerHTML = strategyHTML;
        strategyDetails.innerHTML = '';
    } else {
        // Normal mode - single strategy
        const strategy = getStrategyRecommendation(gameState.playerCards, dealerCard);
        
        let strategyHTML = `
            <div class="text-4xl mb-2">${getActionEmoji(strategy.action)}</div>
            <div class="text-2xl font-bold ${strategy.color || 'text-white'} mb-2">${strategy.message}</div>
        `;
        
        // Add split button if recommendation is split and not already split
        if (strategy.action === 'split' && !gameState.isSplit && gameState.playerCards.length === 2 && gameState.playerCards[0] === gameState.playerCards[1]) {
            strategyHTML += `
                <button onclick="splitHand()" class="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                    ✂️ Split Hand
                </button>
            `;
        }
        
        // Add double down button if recommendation is double and not already doubled
        if (strategy.action === 'double' && !gameState.isDoubled && gameState.playerCards.length === 2) {
            strategyHTML += `
                <button onclick="doubleDown()" class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                    💰 Double Down
                </button>
            `;
        }
        
        // Show doubled indicator if already doubled
        if (gameState.isDoubled) {
            strategyHTML += `
                <div class="mt-2 p-2 bg-blue-500/20 border border-blue-400 rounded-lg">
                    <div class="text-blue-300 font-semibold text-center text-sm">💰 Doubled Down</div>
                    <div class="text-blue-200 text-xs text-center mt-1">Bet: $${gameState.currentBet * 2}</div>
                </div>
            `;
        }
        
        strategyDisplay.innerHTML = strategyHTML;
        
        if (strategy.details) {
            strategyDetails.innerHTML = `<div class="text-center text-green-200">${strategy.details}</div>`;
        } else {
            strategyDetails.innerHTML = '';
        }
    }
    
    // Update bet and bankroll
    document.getElementById('currentBet').value = gameState.currentBet;
    document.getElementById('bankroll').value = gameState.bankroll;
    
    // Show/hide player card buttons
    const playerCardButtons = document.getElementById('playerCardButtons');
    if (gameState.isSplit) {
        if (playerCardButtons) playerCardButtons.classList.add('hidden');
    } else {
        if (playerCardButtons) playerCardButtons.classList.remove('hidden');
    }
    
    // Hide win/push/loss buttons in split mode
    const recordButtons = document.getElementById('recordButtons');
    if (recordButtons) {
        if (gameState.isSplit) {
            recordButtons.style.display = 'none';
        } else {
            recordButtons.style.display = 'flex';
        }
    }
    
    // Update card counting display
    updateCardCountingDisplay();
    
    // Update stats
    updateStats();
}

// Update card counting display
function updateCardCountingDisplay() {
    const runningCount = gameState.cardCounting.runningCount;
    const cardsDealt = gameState.cardCounting.cardsDealt;
    const cardsRemaining = gameState.cardCounting.totalCards - cardsDealt;
    const decksRemaining = Math.max(0, cardsRemaining / 54);
    const trueCount = calculateTrueCount();
    const suggestedBet = getSuggestedBet(trueCount);
    
    // Update display
    const runningCountEl = document.getElementById('runningCount');
    if (runningCountEl) {
        runningCountEl.textContent = runningCount >= 0 ? `+${runningCount}` : runningCount;
        runningCountEl.className = runningCount >= 0 
            ? 'text-white font-bold text-lg text-green-300' 
            : 'text-white font-bold text-lg text-red-300';
    }
    
    const cardsDealtEl = document.getElementById('cardsDealt');
    if (cardsDealtEl) {
        cardsDealtEl.textContent = cardsDealt;
    }
    
    const decksRemainingEl = document.getElementById('decksRemaining');
    if (decksRemainingEl) {
        decksRemainingEl.textContent = decksRemaining.toFixed(1);
    }
    
    const trueCountEl = document.getElementById('trueCount');
    if (trueCountEl) {
        trueCountEl.textContent = trueCount >= 0 ? `+${trueCount.toFixed(1)}` : trueCount.toFixed(1);
        trueCountEl.className = trueCount >= 0 
            ? 'text-white font-bold text-xl text-green-300' 
            : 'text-white font-bold text-xl text-red-300';
    }
    
    const suggestedBetEl = document.getElementById('suggestedBet');
    if (suggestedBetEl) {
        suggestedBetEl.textContent = `$${suggestedBet.bet}`;
        suggestedBetEl.className = `text-white font-bold text-lg ${suggestedBet.color}`;
    }
    
    const suggestedBetMessageEl = document.getElementById('suggestedBetMessage');
    if (suggestedBetMessageEl) {
        suggestedBetMessageEl.textContent = suggestedBet.message;
        suggestedBetMessageEl.className = `text-xs mt-1 ${suggestedBet.color}`;
    }
}

// Get emoji for action
function getActionEmoji(action) {
    const emojis = {
        'hit': '⬇️',
        'stand': '✋',
        'double': '💰',
        'split': '✂️',
        'surrender': '🏳️',
        'blackjack': '🎉',
        'bust': '💥',
        'wait': '🎲',
        'insurance': '🛡️',
        'no-insurance': '❌'
    };
    return emojis[action] || '🎲';
}

// Bet management
function adjustBet(amount) {
    const newBet = gameState.currentBet + amount;
    if (newBet >= 1) {
        gameState.currentBet = newBet;
        updateDisplay();
        saveState();
    }
}

function setBet(amount) {
    gameState.currentBet = amount;
    updateDisplay();
    saveState();
}

// Game actions
function newHand() {
    // Don't reset card count, just clear hands
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isSplit = false;
    gameState.splitHands = [[], []];
    gameState.splitHandResults = [null, null];
    gameState.isDoubled = false;
    gameState.splitHandDoubled = [false, false];
    updateDisplay();
    saveState();
}

function clearAll() {
    if (confirm('Are you sure you want to clear everything? This will reset statistics without saving to history.')) {
        // Reset card counting when clearing all
        resetCardCount();
        gameState.dealerCards = [];
        gameState.playerCards = [];
        gameState.currentBet = 1;
        gameState.isSplit = false;
        gameState.splitHands = [];
        gameState.splitHandResults = [];
        gameState.isDoubled = false;
        gameState.splitHandDoubled = [];
        
        // Reset statistics without saving to history
        gameState.stats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            totalProfit: 0
        };
        
        // Reset suggested bet checkbox to unchecked
        const useSuggestedBetCheckbox = document.getElementById('useSuggestedBet');
        if (useSuggestedBetCheckbox) {
            useSuggestedBetCheckbox.checked = false;
        }
        
        updateDisplay();
        saveState();
    }
}

function recordWin() {
    if (gameState.isSplit) {
        // Don't allow recording win in split mode - use split result buttons
        return;
    }
    gameState.stats.gamesPlayed++;
    gameState.stats.wins++;
    
    // Get effective bet (current bet or suggested bet based on checkbox)
    const effectiveBet = getEffectiveBet();
    
    // Check if player has a blackjack (21 with exactly 2 cards)
    const isBlackjack = gameState.playerCards.length === 2 && calculateHandValue(gameState.playerCards) === 21;
    
    // Calculate profit: Blackjack pays 1.5x, doubled pays 2x, regular pays 1x
    let profit;
    if (isBlackjack) {
        // Blackjack pays 1.5x the effective bet (not doubled)
        profit = effectiveBet * 1.5;
    } else if (gameState.isDoubled) {
        // Doubled down pays 2x
        profit = effectiveBet * 2;
    } else {
        // Regular win pays 1x
        profit = effectiveBet;
    }
    
    gameState.stats.totalProfit += profit;
    gameState.bankroll += profit;
    // Auto clear hands after recording win
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isDoubled = false;
    updateDisplay();
    saveState();
}

function recordPush() {
    if (gameState.isSplit) {
        // Don't allow recording push in split mode - use split result buttons
        return;
    }
    gameState.stats.gamesPlayed++;
    gameState.stats.pushes++;
    // Push: bet is returned, no profit/loss (even if doubled)
    // Bankroll stays the same
    // Auto clear hands after recording push
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isDoubled = false;
    updateDisplay();
    saveState();
}

function recordLoss() {
    if (gameState.isSplit) {
        // Don't allow recording loss in split mode - use split result buttons
        return;
    }
    gameState.stats.gamesPlayed++;
    gameState.stats.losses++;
    
    // Get effective bet (current bet or suggested bet based on checkbox)
    const effectiveBet = getEffectiveBet();
    const loss = gameState.isDoubled ? effectiveBet * 2 : effectiveBet;
    
    gameState.stats.totalProfit -= loss;
    gameState.bankroll -= loss;
    if (gameState.bankroll < 0) gameState.bankroll = 0;
    // Auto clear hands after recording loss
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isDoubled = false;
    updateDisplay();
    saveState();
}

// Record result for a split hand
function recordSplitResult(handIndex, result) {
    if (handIndex < 0 || handIndex >= gameState.splitHands.length) return;
    if (gameState.splitHandResults[handIndex] !== null) return; // Already recorded
    
    gameState.splitHandResults[handIndex] = result;
    
    // Get effective bet (current bet or suggested bet based on checkbox)
    const effectiveBet = getEffectiveBet();
    
    // Calculate profit/loss based on whether this hand was doubled
    const betMultiplier = gameState.splitHandDoubled[handIndex] ? 2 : 1;
    
    // Update stats based on result
    if (result === 'win') {
        gameState.stats.wins++;
        const profit = effectiveBet * betMultiplier;
        gameState.stats.totalProfit += profit;
        gameState.bankroll += profit;
    } else if (result === 'loss') {
        gameState.stats.losses++;
        const loss = effectiveBet * betMultiplier;
        gameState.stats.totalProfit -= loss;
        gameState.bankroll -= loss;
        if (gameState.bankroll < 0) gameState.bankroll = 0;
    } else if (result === 'push') {
        gameState.stats.pushes++;
        // Push: bet returned, no profit/loss (even if doubled)
    }
    
    // Check if all hands are recorded
    const allRecorded = gameState.splitHandResults.every(result => result !== null);
    if (allRecorded) {
        // All hands recorded, increment games played and clear
        gameState.stats.gamesPlayed++;
        gameState.dealerCards = [];
        gameState.playerCards = [];
        gameState.isSplit = false;
        gameState.splitHands = [];
        gameState.splitHandResults = [];
        gameState.splitHandDoubled = [];
    }
    
    updateDisplay();
    saveState();
}

// Double down function
function doubleDown() {
    if (!gameState.isSplit && gameState.playerCards.length === 2) {
        gameState.isDoubled = true;
        updateDisplay();
        saveState();
    }
}

// Double down for specific split hand
function doubleDownSplit(handIndex) {
    if (handIndex >= 0 && handIndex < gameState.splitHands.length && gameState.splitHands[handIndex].length === 2 && gameState.splitHandResults[handIndex] === null) {
        gameState.splitHandDoubled[handIndex] = true;
        updateDisplay();
        saveState();
    }
}

function updateStats() {
    document.getElementById('gamesPlayed').textContent = gameState.stats.gamesPlayed;
    document.getElementById('wins').textContent = gameState.stats.wins;
    document.getElementById('losses').textContent = gameState.stats.losses;
    document.getElementById('pushes').textContent = gameState.stats.pushes || 0;
    
    const winRate = gameState.stats.gamesPlayed > 0 
        ? ((gameState.stats.wins / gameState.stats.gamesPlayed) * 100).toFixed(1)
        : 0;
    document.getElementById('winRate').textContent = winRate + '%';
    
    const profit = gameState.stats.totalProfit >= 0 
        ? '$' + gameState.stats.totalProfit.toFixed(2)
        : '-$' + Math.abs(gameState.stats.totalProfit).toFixed(2);
    document.getElementById('totalProfit').textContent = profit;
    document.getElementById('totalProfit').className = gameState.stats.totalProfit >= 0 
        ? 'text-white font-bold text-green-300' 
        : 'text-white font-bold text-red-300';
}

async function resetStats() {
    if (confirm('Are you sure you want to reset all statistics? The current stats will be saved to history.')) {
        // Save current stats before resetting
        if (gameState.stats.gamesPlayed > 0) {
            try {
                await saveStatsRecord(gameState.stats);
                alert('Statistics saved to history!');
                loadStatsHistory(); // Refresh the history display
            } catch (error) {
                console.error('Failed to save statistics:', error);
                alert('Warning: Failed to save statistics to history. Stats will still be reset.');
            }
        }
        
        // Reset stats
        gameState.stats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            totalProfit: 0
        };
        updateDisplay();
        saveState();
    }
}

// Initialize card counting display on load
document.addEventListener('DOMContentLoaded', () => {
    // This is already called in the existing DOMContentLoaded, but ensure card counting is initialized
    if (typeof updateCardCountingDisplay === 'function') {
        updateCardCountingDisplay();
    }
});

// Save/Load state
function saveState() {
    localStorage.setItem('blackjackState', JSON.stringify(gameState));
}

function loadState() {
    const saved = localStorage.getItem('blackjackState');
    if (saved) {
        try {
            const loadedState = JSON.parse(saved);
            // Merge with default state to ensure all properties exist
            gameState = {
                ...gameState,
                ...loadedState,
                cardCounting: loadedState.cardCounting || {
                    runningCount: 0,
                    cardsDealt: 0,
                    initialDecks: 8,
                    totalCards: 432
                },
                stats: loadedState.stats || {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    pushes: 0,
                    totalProfit: 0
                },
                isDoubled: loadedState.isDoubled || false,
                splitHandDoubled: loadedState.splitHandDoubled || [],
                splitHands: loadedState.splitHands || [],
                splitHandResults: loadedState.splitHandResults || []
            };
        } catch (e) {
            console.error('Error loading state:', e);
        }
    }
}

// Load and display statistics history
async function loadStatsHistory() {
    const records = await getAllStatsRecords();
    const historyContainer = document.getElementById('statsHistory');
    const summaryContainer = document.getElementById('historySummary');
    
    if (!historyContainer) return;
    
    // Calculate totals
    const totalGames = records.reduce((sum, record) => sum + (record.gamesPlayed || 0), 0);
    const totalProfit = records.reduce((sum, record) => sum + (record.totalProfit || 0), 0);
    
    // Update summary
    if (summaryContainer) {
        const summaryTotalGames = document.getElementById('summaryTotalGames');
        const summaryTotalProfit = document.getElementById('summaryTotalProfit');
        
        if (summaryTotalGames) {
            summaryTotalGames.textContent = totalGames.toLocaleString();
        }
        
        if (summaryTotalProfit) {
            const profitClass = totalProfit >= 0 ? 'text-green-300' : 'text-red-300';
            const profitSign = totalProfit >= 0 ? '+' : '';
            summaryTotalProfit.textContent = `${profitSign}$${totalProfit.toFixed(2)}`;
            summaryTotalProfit.className = `font-bold text-2xl ${profitClass}`;
        }
    }
    
    if (records.length === 0) {
        historyContainer.innerHTML = '<div class="text-green-200 text-sm text-center py-4">No saved statistics yet</div>';
        return;
    }
    
    let historyHTML = '<div class="space-y-3 max-h-96 overflow-y-auto">';
    
    records.forEach((record) => {
        const profitClass = record.totalProfit >= 0 ? 'text-green-300' : 'text-red-300';
        const profitSign = record.totalProfit >= 0 ? '+' : '';
        
        historyHTML += `
            <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="text-white font-semibold text-sm">${record.datetime}</div>
                        <div class="text-green-200 text-xs">${record.date}</div>
                    </div>
                    <button onclick="deleteStatsRecordById(${record.id})" class="text-red-400 hover:text-red-300 text-xs">Delete</button>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <span class="text-green-200">Games:</span>
                        <span class="text-white font-bold ml-1">${record.gamesPlayed}</span>
                    </div>
                    <div>
                        <span class="text-green-200">Win Rate:</span>
                        <span class="text-white font-bold ml-1">${record.winRate}%</span>
                    </div>
                    <div>
                        <span class="text-green-200">Profit:</span>
                        <span class="font-bold ml-1 ${profitClass}">${profitSign}$${record.totalProfit.toFixed(2)}</span>
                    </div>
                    <div>
                        <span class="text-green-200">Wins:</span>
                        <span class="text-white font-bold ml-1">${record.wins}</span>
                    </div>
                    <div>
                        <span class="text-green-200">Losses:</span>
                        <span class="text-white font-bold ml-1">${record.losses}</span>
                    </div>
                    <div>
                        <span class="text-green-200">Pushes:</span>
                        <span class="text-white font-bold ml-1">${record.pushes || 0}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    historyHTML += '</div>';
    historyContainer.innerHTML = historyHTML;
}

// Delete stats record by ID (called from HTML)
async function deleteStatsRecordById(id) {
    if (confirm('Are you sure you want to delete this statistics record?')) {
        const success = await deleteStatsRecord(id);
        if (success) {
            loadStatsHistory(); // Refresh the history display
        } else {
            alert('Failed to delete record');
        }
    }
}

// Export all statistics records as JSON
async function exportStatsRecords() {
    try {
        const records = await getAllStatsRecords();
        const dataStr = JSON.stringify(records, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blackjack-stats-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Exported', records.length, 'records');
        return records;
    } catch (error) {
        console.error('Error exporting records:', error);
        alert('Failed to export records');
        return null;
    }
}

// Import statistics records from JSON file
async function importStatsRecords(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const records = JSON.parse(e.target.result);
                if (!Array.isArray(records)) {
                    throw new Error('Invalid file format');
                }
                
                if (!db) {
                    await initDB();
                }
                
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                let imported = 0;
                for (const record of records) {
                    // Remove the id if present (will be auto-generated)
                    const { id, ...recordWithoutId } = record;
                    await store.add(recordWithoutId);
                    imported++;
                }
                
                await transaction.complete;
                console.log('Imported', imported, 'records');
                loadStatsHistory();
                alert(`Successfully imported ${imported} records!`);
                resolve(imported);
            } catch (error) {
                console.error('Error importing records:', error);
                alert('Failed to import records: ' + error.message);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Clear all statistics records from database
async function clearAllStatsRecords() {
    if (confirm('Are you sure you want to delete ALL saved statistics records? This cannot be undone.')) {
        try {
            if (!db) {
                await initDB();
            }
            
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            await store.clear();
            await transaction.complete;
            
            console.log('All statistics records cleared');
            loadStatsHistory();
            alert('All statistics records have been deleted');
            return true;
        } catch (error) {
            console.error('Error clearing records:', error);
            alert('Failed to clear records');
            return false;
        }
    }
    return false;
}

// Get database statistics (count, total profit, etc.)
async function getDatabaseStats() {
    try {
        const records = await getAllStatsRecords();
        const totalRecords = records.length;
        const totalProfit = records.reduce((sum, r) => sum + r.totalProfit, 0);
        const totalGames = records.reduce((sum, r) => sum + r.gamesPlayed, 0);
        const totalWins = records.reduce((sum, r) => sum + r.wins, 0);
        const totalLosses = records.reduce((sum, r) => sum + r.losses, 0);
        
        const stats = {
            totalRecords,
            totalProfit,
            totalGames,
            totalWins,
            totalLosses,
            overallWinRate: totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0,
            oldestRecord: records.length > 0 ? records[records.length - 1].datetime : null,
            newestRecord: records.length > 0 ? records[0].datetime : null
        };
        
        console.log('Database Statistics:', stats);
        return stats;
    } catch (error) {
        console.error('Error getting database stats:', error);
        return null;
    }
}

// Make functions available globally for console access
window.exportStatsRecords = exportStatsRecords;
window.importStatsRecords = importStatsRecords;
window.clearAllStatsRecords = clearAllStatsRecords;
window.getDatabaseStats = getDatabaseStats;
window.getAllStatsRecords = getAllStatsRecords;

// Make bet inputs update state
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentBet').addEventListener('change', (e) => {
        const value = parseInt(e.target.value) || 1;
        gameState.currentBet = Math.max(1, value);
        updateDisplay();
        saveState();
    });
    
    document.getElementById('bankroll').addEventListener('change', (e) => {
        const value = parseInt(e.target.value) || 0;
        gameState.bankroll = Math.max(0, value);
        updateDisplay();
        saveState();
    });
});

