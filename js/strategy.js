// Strategy Recommendations with Card Counting Adjustments

import { calculateHandValue, isSoftHand } from './cardUtils.js';
import { cardValues } from './constants.js';
import { calculateTrueCount } from './cardCounting.js';

/**
 * Get strategy recommendation based on player cards and dealer card
 * @param {string[]} playerCards - Player's cards
 * @param {string} dealerCard - Dealer's up card
 * @param {Object} cardCounting - Card counting state
 * @returns {Object} Strategy recommendation with action, message, color, and details
 */
export function getStrategyRecommendation(playerCards, dealerCard, cardCounting) {
    if (playerCards.length === 0 || dealerCard === null) {
        return { action: 'wait', message: 'Add cards to get recommendations' };
    }
    
    const playerValue = calculateHandValue(playerCards);
    const dealerValue = cardValues[dealerCard] === 11 ? 11 : cardValues[dealerCard];
    const isSoft = isSoftHand(playerCards);
    const canDouble = playerCards.length === 2;
    const canSplit = playerCards.length === 2 && playerCards[0] === playerCards[1];
    
    // Insurance recommendation based on True Count (when dealer shows Ace)
    let insuranceRecommendation = null;
    if (dealerCard === 'A' && playerCards.length === 2) {
        const trueCount = calculateTrueCount(cardCounting);
        if (trueCount >= 3) {
            insuranceRecommendation = { 
                action: 'insurance', 
                message: 'BUY INSURANCE 🛡️', 
                color: 'text-blue-400',
                details: `True Count ${trueCount.toFixed(1)} >= 3: Insurance is profitable`
            };
        } else {
            insuranceRecommendation = { 
                action: 'no-insurance', 
                message: 'NO INSURANCE ❌', 
                color: 'text-red-300',
                details: `True Count ${trueCount.toFixed(1)} < 3: Insurance is not profitable`
            };
        }
    }
    
    // Blackjack!
    if (playerCards.length === 2 && playerValue === 21) {
        const blackjackResult = { action: 'blackjack', message: 'BLACKJACK! 🎉', color: 'text-yellow-300' };
        if (insuranceRecommendation) {
            blackjackResult.insurance = insuranceRecommendation;
        }
        return blackjackResult;
    }
    
    // Bust
    if (playerValue > 21) {
        return { action: 'bust', message: 'BUST! 💥', color: 'text-red-400' };
    }
    
    // Pair splitting strategy
    if (canSplit) {
        const splitStrategy = getPairSplittingStrategy(playerCards[0], dealerValue);
        if (insuranceRecommendation) {
            splitStrategy.insurance = insuranceRecommendation;
        }
        return splitStrategy;
    }
    
    // Soft hands (Ace counted as 11)
    let basicStrategy;
    if (isSoft && playerCards.includes('A')) {
        basicStrategy = getSoftHandStrategy(playerValue, dealerValue, canDouble);
    } else {
        // Hard hands
        basicStrategy = getHardHandStrategy(playerValue, dealerValue, isSoft, canDouble, cardCounting);
    }
    
    // If we have an insurance recommendation, combine it with basic strategy
    if (insuranceRecommendation) {
        return {
            ...basicStrategy,
            insurance: insuranceRecommendation
        };
    }
    
    return basicStrategy;
}

/**
 * Get pair splitting strategy
 */
function getPairSplittingStrategy(pairValue, dealerValue) {
    if (pairValue === 'A' || pairValue === '8') {
        return { action: 'split', message: 'SPLIT', color: 'text-purple-300', details: 'Always split Aces and 8s' };
    }
    if (pairValue === '10' || pairValue === 'J' || pairValue === 'Q' || pairValue === 'K') {
        return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Never split 10s' };
    }
    if (pairValue === '9') {
        if ((dealerValue >= 2 && dealerValue <= 6) || dealerValue === 8 || dealerValue === 9) {
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
    return { action: 'hit', message: 'HIT', color: 'text-green-300' };
}

/**
 * Get soft hand strategy
 */
function getSoftHandStrategy(playerValue, dealerValue, canDouble) {
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

/**
 * Get hard hand strategy with card counting adjustments
 */
function getHardHandStrategy(playerValue, dealerValue, isSoft, canDouble, cardCounting) {
    if (playerValue >= 17) {
        // Hard 17 vs A: Surrender (late surrender) - available with 2 or more cards
        if (playerValue === 17 && dealerValue === 11 && !isSoft) {
            return { action: 'surrender', message: 'SURRENDER 🏳️', color: 'text-orange-300', details: 'Surrender Hard 17 vs A' };
        }
        return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Always stand on 17+' };
    }
    
    const trueCount = calculateTrueCount(cardCounting);
    
    // Surrender recommendations (check before other actions) - available with 2 or more cards
    if (!isSoft) {
        // Hard 16 vs 9: Surrender if TC < 0, otherwise stand if TC >= 5, otherwise hit
        if (playerValue === 16 && dealerValue === 9) {
            if (trueCount < 0) {
                return { action: 'surrender', message: 'SURRENDER 🏳️', color: 'text-orange-300', details: `Hard 16 vs 9: Surrender (TC ${trueCount.toFixed(1)} < 0)` };
            }
            if (trueCount >= 5) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 16 vs 9: Stand (TC ${trueCount.toFixed(1)} >= 5)` };
            }
            // TC >= 0 and < 5: Hit (basic strategy)
            return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 16 vs 9: Hit (TC ${trueCount.toFixed(1)} < 5)` };
        }
        
        // Hard 16 vs 10: Surrender if TC < 0, otherwise stand if TC >= 1
        if (playerValue === 16 && dealerValue === 10) {
            if (trueCount < 0) {
                return { action: 'surrender', message: 'SURRENDER 🏳️', color: 'text-orange-300', details: `Hard 16 vs 10: Surrender (TC ${trueCount.toFixed(1)} < 0)` };
            }
            // TC >= 1 case is handled below
        }
        
        // Hard 16 vs A: Surrender
        if (playerValue === 16 && dealerValue === 11) {
            return { action: 'surrender', message: 'SURRENDER 🏳️', color: 'text-orange-300', details: 'Surrender Hard 16 vs A' };
        }
        
        // Hard 15 vs 10: Surrender if TC < 0, otherwise stand if TC >= 4
        if (playerValue === 15 && dealerValue === 10) {
            if (trueCount < 0) {
                return { action: 'surrender', message: 'SURRENDER 🏳️', color: 'text-orange-300', details: `Hard 15 vs 10: Surrender (TC ${trueCount.toFixed(1)} < 0)` };
            }
            // TC >= 4 case is handled below
        }
        
        // Hard 14 vs 10: Surrender if TC < -1
        if (playerValue === 14 && dealerValue === 10) {
            if (trueCount < -1) {
                return { action: 'surrender', message: 'SURRENDER 🏳️', color: 'text-orange-300', details: `Hard 14 vs 10: Surrender (TC ${trueCount.toFixed(1)} < -1)` };
            }
        }
    }
    
    // Hard 16
    if (playerValue === 16) {
        if (dealerValue >= 2 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 16 vs 2-6' };
        }
        if (dealerValue === 9) {
            // Already handled in surrender section above - should not reach here
            return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 16 vs 9' };
        }
        if (dealerValue === 10 && !isSoft) {
            if (trueCount >= 1) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 16 vs 10: Stand (TC ${trueCount.toFixed(1)} >= 1)` };
            }
            // TC < 1 but >= 0: Hit (basic strategy, surrender already handled if TC < 0)
            return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 16 vs 10: Hit (TC ${trueCount.toFixed(1)} < 1)` };
        }
        if (dealerValue === 11) {
            // Already handled in surrender section above (Hard 16 vs A always surrender)
            return { action: 'surrender', message: 'SURRENDER 🏳️', color: 'text-orange-300', details: 'Surrender Hard 16 vs A' };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 16 vs 7-8' };
    }
    
    // Hard 15
    if (playerValue === 15) {
        if (dealerValue >= 2 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 15 vs 2-6' };
        }
        if (!isSoft) {
            if (dealerValue === 10) {
                if (trueCount >= 4) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 15 vs 10: Stand (TC ${trueCount.toFixed(1)} >= 4)` };
                }
                // TC < 4 but >= 0: Hit (basic strategy, surrender already handled if TC < 0)
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 15 vs 10: Hit (TC ${trueCount.toFixed(1)} < 4)` };
            }
            if (dealerValue === 9 && trueCount >= 2) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 15 vs 9: Stand (TC ${trueCount.toFixed(1)} >= 2)` };
            }
            if (dealerValue === 11 && trueCount >= 1) { // Ace
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 15 vs A: Stand (TC ${trueCount.toFixed(1)} >= 1)` };
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 15 vs 7-A' };
    }
    
    // Hard 14
    if (playerValue === 14) {
        if (dealerValue >= 2 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 14 vs 2-6' };
        }
        if (dealerValue === 10 && !isSoft) {
            if (trueCount >= 3) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 14 vs 10: Stand (TC ${trueCount.toFixed(1)} >= 3)` };
            }
            // TC < 3 but >= -1: Hit (basic strategy, surrender already handled if TC < -1)
            return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 14 vs 10: Hit (TC ${trueCount.toFixed(1)} < 3)` };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 14 vs 7-9, A' };
    }
    
    // Hard 13
    if (playerValue === 13) {
        if (dealerValue === 2 && !isSoft) {
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
    
    // Hard 12
    if (playerValue === 12) {
        if (!isSoft) {
            // Card counting adjustments
            if ((dealerValue === 2 || dealerValue === 3) && trueCount >= 2) {
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs ${dealerValue}: Stand (TC ${trueCount.toFixed(1)} >= 2)` };
            }
            if (dealerValue === 4) {
                if (trueCount >= 3) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs 4: Stand (TC ${trueCount.toFixed(1)} >= 3)` };
                }
                // Basic strategy: stand on 12 vs 4-6
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 12 vs 4-6' };
            }
            if (dealerValue === 5) {
                if (trueCount >= 1) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs 5: Stand (TC ${trueCount.toFixed(1)} >= 1)` };
                }
                // Basic strategy: stand on 12 vs 4-6
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 12 vs 4-6' };
            }
            if (dealerValue === 6) {
                if (trueCount >= -1) {
                    return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: `Hard 12 vs 6: Stand (TC ${trueCount.toFixed(1)} >= -1)` };
                }
                // Basic strategy: stand on 12 vs 4-6
                return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 12 vs 4-6' };
            }
        }
        // Basic strategy: stand on 12 vs 4-6 (for soft hands or when card counting doesn't apply)
        if (dealerValue >= 4 && dealerValue <= 6) {
            return { action: 'stand', message: 'STAND', color: 'text-yellow-300', details: 'Stand on 12 vs 4-6' };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 12 vs 2-3, 7-A' };
    }
    
    // Hard 11
    if (playerValue === 11) {
        if (canDouble) {
            if (dealerValue === 11 && !isSoft) { // Ace
                if (trueCount >= 1) {
                    return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 11 vs A: Double (TC ${trueCount.toFixed(1)} >= 1)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 11 vs A: Hit (TC ${trueCount.toFixed(1)} < 1)` };
            }
            return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Always double 11' };
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 11 (can\'t double)' };
    }
    
    // Hard 10
    if (playerValue === 10) {
        if (canDouble) {
            if (!isSoft) {
                if (dealerValue === 10 && trueCount >= 4) {
                    return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 10 vs 10: Double (TC ${trueCount.toFixed(1)} >= 4)` };
                }
                if (dealerValue === 11 && trueCount >= 4) { // Ace
                    return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 10 vs A: Double (TC ${trueCount.toFixed(1)} >= 4)` };
                }
            }
            if (dealerValue >= 2 && dealerValue <= 9) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double 10 vs 2-9' };
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 10' };
    }
    
    // Hard 9
    if (playerValue === 9) {
        if (canDouble) {
            if (dealerValue === 2 && !isSoft) {
                if (trueCount >= 1) {
                    return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: `Hard 9 vs 2: Double (TC ${trueCount.toFixed(1)} >= 1)` };
                }
                return { action: 'hit', message: 'HIT', color: 'text-green-300', details: `Hard 9 vs 2: Hit (TC ${trueCount.toFixed(1)} < 1)` };
            }
            if (dealerValue >= 3 && dealerValue <= 6) {
                return { action: 'double', message: 'DOUBLE', color: 'text-blue-300', details: 'Double 9 vs 3-6' };
            }
        }
        return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Hit 9' };
    }
    
    // Always hit on 8 or less
    return { action: 'hit', message: 'HIT', color: 'text-green-300', details: 'Always hit on 8 or less' };
}

/**
 * Get emoji for action
 */
export function getActionEmoji(action) {
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

