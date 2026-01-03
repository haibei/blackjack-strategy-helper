// Game Logic - Card Management, Splitting, Doubling

import { updateCardCount } from './cardCounting.js';
import { calculateHandValue } from './cardUtils.js';

/**
 * Add card to hand
 */
export function addCard(gameState, hand, card) {
    try {
        if (hand === 'dealer') {
            gameState.dealerCards.push(card);
        } else if (hand === 'player') {
            if (gameState.isSplit) {
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
            const handIndex = parseInt(hand.split('-')[1]);
            if (!isNaN(handIndex) && handIndex >= 0 && handIndex < gameState.splitHands.length) {
                gameState.splitHands[handIndex].push(card);
            }
        }
        
        updateCardCount(gameState.cardCounting, card, 'add');
    } catch (error) {
        console.error('Error adding card:', error);
    }
}

/**
 * Remove card from hand
 */
export function removeCard(gameState, hand, index) {
    let removedCard = null;
    
    if (hand === 'dealer') {
        removedCard = gameState.dealerCards[index];
        gameState.dealerCards.splice(index, 1);
    } else if (hand === 'player') {
        if (gameState.isSplit) {
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
    
    if (removedCard) {
        updateCardCount(gameState.cardCounting, removedCard, 'remove');
    }
}

/**
 * Clear hand
 */
export function clearHand(gameState, hand) {
    if (hand === 'dealer') {
        gameState.dealerCards.forEach(card => updateCardCount(gameState.cardCounting, card, 'remove'));
        gameState.dealerCards = [];
    } else if (hand === 'player') {
        gameState.playerCards.forEach(card => updateCardCount(gameState.cardCounting, card, 'remove'));
        gameState.playerCards = [];
        gameState.isSplit = false;
        gameState.splitHands.forEach(splitHand => {
            splitHand.forEach(card => updateCardCount(gameState.cardCounting, card, 'remove'));
        });
        gameState.splitHands = [];
        gameState.splitHandResults = [];
        gameState.isDoubled = false;
        gameState.splitHandDoubled = [];
    } else if (hand.startsWith('split-')) {
        const handIndex = parseInt(hand.split('-')[1]);
        gameState.splitHands[handIndex].forEach(card => updateCardCount(gameState.cardCounting, card, 'remove'));
        gameState.splitHands[handIndex] = [];
        gameState.splitHandResults[handIndex] = null;
        gameState.splitHandDoubled[handIndex] = false;
    }
}

/**
 * Split hand
 */
export function splitHand(gameState, handIndex = null) {
    // Only allow splitting the initial hand, not already-split hands (no 2nd level splits)
    if (handIndex !== null && gameState.isSplit) {
        // Second-level splits are not allowed
        return;
    }
    
    if (gameState.playerCards.length === 2 && gameState.playerCards[0] === gameState.playerCards[1]) {
        gameState.isSplit = true;
        gameState.splitHands = [[gameState.playerCards[0]], [gameState.playerCards[1]]];
        gameState.playerCards = [];
        gameState.splitHandResults = [null, null];
        gameState.splitHandDoubled = [false, false];
    }
}

/**
 * Double down
 */
export function doubleDown(gameState) {
    if (!gameState.isSplit && gameState.playerCards.length === 2) {
        gameState.isDoubled = true;
    }
}

/**
 * Double down for split hand
 */
export function doubleDownSplit(gameState, handIndex) {
    if (handIndex >= 0 && handIndex < gameState.splitHands.length && 
        gameState.splitHands[handIndex].length === 2 && 
        gameState.splitHandResults[handIndex] === null) {
        gameState.splitHandDoubled[handIndex] = true;
    }
}

/**
 * Record win
 */
export function recordWin(gameState, getEffectiveBetFn) {
    if (gameState.isSplit) {
        return;
    }
    
    gameState.stats.gamesPlayed++;
    gameState.stats.wins++;
    
    const effectiveBet = getEffectiveBetFn();
    const isBlackjack = gameState.playerCards.length === 2 && calculateHandValue(gameState.playerCards) === 21;
    
    let profit;
    if (isBlackjack) {
        profit = effectiveBet * 1.5;
    } else if (gameState.isDoubled) {
        profit = effectiveBet * 2;
    } else {
        profit = effectiveBet;
    }
    
    gameState.stats.totalProfit += profit;
    gameState.bankroll += profit;
    
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isDoubled = false;
}

/**
 * Record push
 */
export function recordPush(gameState) {
    if (gameState.isSplit) {
        return;
    }
    
    gameState.stats.gamesPlayed++;
    gameState.stats.pushes++;
    
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isDoubled = false;
}

/**
 * Record loss
 */
export function recordLoss(gameState, getEffectiveBetFn) {
    if (gameState.isSplit) {
        return;
    }
    
    gameState.stats.gamesPlayed++;
    gameState.stats.losses++;
    
    const effectiveBet = getEffectiveBetFn();
    const loss = gameState.isDoubled ? effectiveBet * 2 : effectiveBet;
    
    gameState.stats.totalProfit -= loss;
    gameState.bankroll -= loss;
    if (gameState.bankroll < 0) gameState.bankroll = 0;
    
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isDoubled = false;
}

/**
 * Record surrender (cashout - lose half bet)
 */
export function recordSurrender(gameState, getEffectiveBetFn) {
    if (gameState.isSplit) {
        return;
    }
    
    gameState.stats.gamesPlayed++;
    gameState.stats.losses++;
    
    const effectiveBet = getEffectiveBetFn();
    const loss = effectiveBet * 0.5; // Surrender loses half the bet
    
    gameState.stats.totalProfit -= loss;
    gameState.bankroll -= loss;
    if (gameState.bankroll < 0) gameState.bankroll = 0;
    
    gameState.dealerCards = [];
    gameState.playerCards = [];
    gameState.isDoubled = false;
}

/**
 * Record surrender for a split hand (cashout - lose half bet)
 */
export function recordSplitSurrender(gameState, handIndex, getEffectiveBetFn) {
    if (handIndex < 0 || handIndex >= gameState.splitHands.length) return;
    if (gameState.splitHandResults[handIndex] !== null) return;
    
    gameState.splitHandResults[handIndex] = 'loss'; // Mark as loss for surrender
    gameState.stats.losses++;
    
    const effectiveBet = getEffectiveBetFn();
    const betMultiplier = gameState.splitHandDoubled[handIndex] ? 2 : 1;
    const loss = effectiveBet * betMultiplier * 0.5; // Surrender loses half the bet
    
    gameState.stats.totalProfit -= loss;
    gameState.bankroll -= loss;
    if (gameState.bankroll < 0) gameState.bankroll = 0;
    
    // Check if all hands are finished
    const allRecorded = gameState.splitHandResults.every(result => result !== null);
    if (allRecorded) {
        gameState.stats.gamesPlayed++;
        gameState.dealerCards = [];
        gameState.playerCards = [];
        gameState.isSplit = false;
        gameState.splitHands = [];
        gameState.splitHandResults = [];
        gameState.splitHandDoubled = [];
    }
}

/**
 * Record split hand result
 */
export function recordSplitResult(gameState, handIndex, result, getEffectiveBetFn) {
    if (handIndex < 0 || handIndex >= gameState.splitHands.length) return;
    if (gameState.splitHandResults[handIndex] !== null) return;
    
    gameState.splitHandResults[handIndex] = result;
    const effectiveBet = getEffectiveBetFn();
    const betMultiplier = gameState.splitHandDoubled[handIndex] ? 2 : 1;
    
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
    }
    
    const allRecorded = gameState.splitHandResults.every(result => result !== null);
    if (allRecorded) {
        gameState.stats.gamesPlayed++;
        gameState.dealerCards = [];
        gameState.playerCards = [];
        gameState.isSplit = false;
        gameState.splitHands = [];
        gameState.splitHandResults = [];
        gameState.splitHandDoubled = [];
    }
}

