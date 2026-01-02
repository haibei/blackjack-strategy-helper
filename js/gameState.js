// Game State Management

export function createInitialGameState() {
    return {
        dealerCards: [],
        playerCards: [],
        currentBet: 1,
        bankroll: 1000,
        isSplit: false,
        splitHands: [],
        splitHandResults: [],
        isDoubled: false,
        splitHandDoubled: [],
        cardCounting: {
            runningCount: 0,
            cardsDealt: 0,
            initialDecks: 8,
            totalCards: 432
        },
        stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            totalProfit: 0
        }
    };
}

export function resetGameState(gameState) {
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.currentBet = 1;
    gameState.isSplit = false;
    gameState.splitHands = [];
    gameState.splitHandResults = [];
    gameState.isDoubled = false;
    gameState.splitHandDoubled = [];
    gameState.cardCounting.runningCount = 0;
    gameState.cardCounting.cardsDealt = 0;
    gameState.stats = {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalProfit: 0
    };
    return gameState;
}

export function resetStats(gameState) {
    gameState.stats = {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalProfit: 0
    };
    return gameState;
}

