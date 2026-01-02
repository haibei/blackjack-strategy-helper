// Card Counting Logic

import { cardCountValues } from './constants.js';

/**
 * Update card count when a card is dealt
 * @param {Object} cardCounting - Card counting state
 * @param {string} card - Card value
 * @param {string} action - 'add' or 'remove'
 */
export function updateCardCount(cardCounting, card, action) {
    try {
        if (!cardCounting) {
            cardCounting = {
                runningCount: 0,
                cardsDealt: 0,
                initialDecks: 8,
                totalCards: 432
            };
        }
        
        const countValue = cardCountValues[card] || 0;
        
        if (action === 'add') {
            cardCounting.runningCount += countValue;
            cardCounting.cardsDealt++;
        } else if (action === 'remove') {
            if (cardCounting.cardsDealt > 0) {
                cardCounting.runningCount -= countValue;
                cardCounting.cardsDealt--;
            }
        }
    } catch (error) {
        console.error('Error updating card count:', error);
    }
}

/**
 * Calculate True Count
 * @param {Object} cardCounting - Card counting state
 * @returns {number} True Count
 */
export function calculateTrueCount(cardCounting) {
    const cardsRemaining = cardCounting.totalCards - cardCounting.cardsDealt;
    const decksRemaining = cardsRemaining / 54;
    
    if (decksRemaining <= 0) {
        return 0;
    }
    
    return Math.round((cardCounting.runningCount / decksRemaining) * 10) / 10;
}

/**
 * Get suggested bet based on True Count
 * @param {number} trueCount - True Count value
 * @returns {Object} Bet suggestion with bet amount, message, and color
 */
export function getSuggestedBet(trueCount) {
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

/**
 * Reset card counting
 * @param {Object} cardCounting - Card counting state
 */
export function resetCardCount(cardCounting) {
    cardCounting.runningCount = 0;
    cardCounting.cardsDealt = 0;
}

