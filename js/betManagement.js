// Bet Management

import { calculateTrueCount, getSuggestedBet } from './cardCounting.js';

/**
 * Get effective bet (current bet or suggested bet based on checkbox)
 */
export function getEffectiveBet(gameState, useSuggestedBet) {
    if (useSuggestedBet) {
        const trueCount = calculateTrueCount(gameState.cardCounting);
        const suggestedBet = getSuggestedBet(trueCount);
        return suggestedBet.bet;
    }
    return gameState.currentBet;
}

/**
 * Adjust bet
 */
export function adjustBet(gameState, amount) {
    const newBet = gameState.currentBet + amount;
    gameState.currentBet = Math.max(1, newBet);
}

/**
 * Set bet
 */
export function setBet(gameState, amount) {
    if (amount >= 1) {
        gameState.currentBet = amount;
    }
}

