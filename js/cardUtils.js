// Card utility functions

import { cardValues } from './constants.js';

/**
 * Calculate the value of a hand
 * @param {string[]} cards - Array of card values
 * @returns {number} Hand value
 */
export function calculateHandValue(cards) {
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
    
    // Adjust for aces - convert from 11 to 1 until value <= 21
    // Keep adjusting as long as we're over 21 and have aces to adjust
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    
    return value;
}

/**
 * Check if hand is soft (contains ace counted as 11)
 * @param {string[]} cards - Array of card values
 * @returns {boolean} True if soft hand
 */
export function isSoftHand(cards) {
    if (cards.length === 0) {
        return false;
    }
    
    let value = 0;
    let aces = 0;
    
    // Count all cards, aces as 11
    for (const card of cards) {
        if (card === 'A') {
            aces++;
            value += 11;
        } else {
            value += cardValues[card];
        }
    }
    
    // If value is already <= 21, it's soft (at least one ace is 11)
    if (value <= 21) {
        return aces > 0;
    }
    
    // If value > 21, check if we can have at least one ace as 11
    // Calculate minimum value with all aces as 1
    const minValue = value - (aces * 10);
    
    // If minimum value is already > 21, it's not soft (bust)
    if (minValue > 21) {
        return false;
    }
    
    // Check if we can have at least one ace as 11
    // Minimum value with one ace as 11: minValue + 10
    // This must be <= 21 for the hand to be soft
    return (minValue + 10) <= 21 && aces > 0;
}

