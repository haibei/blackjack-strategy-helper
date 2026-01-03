// Blackjack Strategy Helper App - Refactored
// Main application file that orchestrates all modules

import { createInitialGameState, resetGameState, resetStats as resetStatsState } from './js/gameState.js';
import { calculateHandValue, isSoftHand } from './js/cardUtils.js';
import { updateCardCount, calculateTrueCount, getSuggestedBet, resetCardCount } from './js/cardCounting.js';
import { getStrategyRecommendation, getActionEmoji } from './js/strategy.js';
import { addCard, removeCard, clearHand, splitHand, doubleDown, doubleDownSplit, recordWin, recordPush, recordLoss, recordSurrender, recordSplitResult, recordSplitSurrender } from './js/gameLogic.js';
import { getEffectiveBet, adjustBet, setBet } from './js/betManagement.js';
import { initDB, saveStatsRecord, getAllStatsRecords, deleteStatsRecord, clearAllStatsRecords, exportStatsRecords, importStatsRecords, getDatabaseStats } from './js/statistics.js';
import { cardValues } from './js/constants.js';

// Game state - exported for testing
export let gameState = createInitialGameState();

// LocalStorage key
const STATE_KEY = 'blackjackState';

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Update the main display
 */
export function updateDisplay() {
    // Update dealer cards
    const dealerCardsDiv = document.getElementById('dealerCards');
    dealerCardsDiv.innerHTML = '';
    if (gameState.dealerCards.length === 0) {
        dealerCardsDiv.innerHTML = '<div class="text-green-200 text-sm">Click cards to add</div>';
    } else {
        gameState.dealerCards.forEach((card, index) => {
            const cardDiv = createCardElement(card, () => removeCard(gameState, 'dealer', index));
            dealerCardsDiv.appendChild(cardDiv);
        });
    }
    
    // Update player cards
    updatePlayerCardsDisplay();
    
    // Update hand values
    updateHandValues();
    
    // Update strategy recommendation
    updateStrategyDisplay();
    
    // Update bet and bankroll
    updateBetDisplay();
    
    // Update card counting display
    updateCardCountingDisplay();
    
    // Update stats
    updateStats();
}

/**
 * Update player cards display (handles split mode)
 */
function updatePlayerCardsDisplay() {
    const playerCardsDiv = document.getElementById('playerCards');
    playerCardsDiv.innerHTML = '';
    
    if (gameState.isSplit) {
        gameState.splitHands.forEach((hand, handIndex) => {
            const handContainer = createSplitHandContainer(hand, handIndex);
            playerCardsDiv.appendChild(handContainer);
        });
    } else {
        if (gameState.playerCards.length === 0) {
            playerCardsDiv.innerHTML = '<div class="text-green-200 text-sm">Click cards to add</div>';
        } else {
            gameState.playerCards.forEach((card, index) => {
                const cardDiv = createCardElement(card, () => removeCard(gameState, 'player', index));
                playerCardsDiv.appendChild(cardDiv);
            });
        }
    }
}

/**
 * Create card element
 */
function createCardElement(card, onRemove) {
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
        onRemove();
        updateDisplay();
        saveState();
    };
    cardDiv.appendChild(removeBtn);
    
    return cardDiv;
}

/**
 * Create split hand container
 */
function createSplitHandContainer(hand, handIndex) {
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
            const cardDiv = createCardElement(card, () => removeCard(gameState, 'split-' + handIndex, index));
            cardsContainer.appendChild(cardDiv);
        });
    }
    
    handContainer.appendChild(cardsContainer);
    
    // Add card buttons
    const cardButtonsContainer = document.createElement('div');
    cardButtonsContainer.className = 'flex gap-1.5 mb-2';
    ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach(card => {
        const btn = document.createElement('button');
        btn.className = card === 'A' ? 'card-btn bg-red-600 hover:bg-red-700' : 'card-btn';
        btn.textContent = card;
        btn.onclick = () => {
            addCard(gameState, 'split-' + handIndex, card);
            updateDisplay();
            saveState();
        };
        cardButtonsContainer.appendChild(btn);
    });
    handContainer.appendChild(cardButtonsContainer);
    
    // Add split/double/result buttons if needed
    addSplitHandActionButtons(handContainer, hand, handIndex);
    
    return handContainer;
}

/**
 * Add action buttons for split hands
 */
function addSplitHandActionButtons(container, hand, handIndex) {
    const dealerCard = gameState.dealerCards.length > 0 ? gameState.dealerCards[0] : null;
    const strategy = getStrategyRecommendation(hand, dealerCard, gameState.cardCounting);
    
    // Split button removed - only allow splitting once (no 2nd level splits)
    
    // Double button
    if (hand.length === 2 && !gameState.splitHandDoubled[handIndex] && !gameState.splitHandResults[handIndex] && strategy.action === 'double') {
        const doubleButton = document.createElement('button');
        doubleButton.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold mb-2';
        doubleButton.textContent = '💰 Double Down';
        doubleButton.onclick = () => {
            doubleDownSplit(gameState, handIndex);
            updateDisplay();
            saveState();
        };
        container.appendChild(doubleButton);
    }
    
    // Result buttons
    if (hand.length > 0 && !gameState.splitHandResults[handIndex]) {
        const resultButtons = document.createElement('div');
        resultButtons.className = 'flex gap-1 mb-2';
        resultButtons.innerHTML = `
            <button onclick="recordSplitResult(${handIndex}, 'win')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold">Win</button>
            <button onclick="recordSplitResult(${handIndex}, 'push')" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs font-semibold">Push</button>
            <button onclick="recordSplitResult(${handIndex}, 'loss')" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold">Loss</button>
        `;
        container.appendChild(resultButtons);
    }
}

/**
 * Update hand values display
 */
function updateHandValues() {
    const dealerValue = calculateHandValue(gameState.dealerCards);
    let playerValue = 0;
    if (gameState.isSplit) {
        playerValue = gameState.splitHands.map(h => calculateHandValue(h)).join(' / ');
    } else {
        playerValue = calculateHandValue(gameState.playerCards);
    }
    document.getElementById('dealerValue').textContent = dealerValue;
    document.getElementById('playerValue').textContent = playerValue;
}

/**
 * Update strategy recommendation display
 */
function updateStrategyDisplay() {
    const dealerCard = gameState.dealerCards.length > 0 ? gameState.dealerCards[0] : null;
    const strategyDisplay = document.getElementById('strategyDisplay');
    const strategyDetails = document.getElementById('strategyDetails');
    
    if (gameState.isSplit) {
        updateSplitStrategyDisplay(strategyDisplay, dealerCard);
        strategyDetails.innerHTML = '';
    } else {
        updateSingleStrategyDisplay(strategyDisplay, strategyDetails, dealerCard);
    }
}

/**
 * Update strategy for split hands
 */
function updateSplitStrategyDisplay(strategyDisplay, dealerCard) {
    let strategyHTML = '<div class="space-y-4">';
    
    gameState.splitHands.forEach((hand, handIndex) => {
        const strategy = getStrategyRecommendation(hand, dealerCard, gameState.cardCounting);
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
        
        if (strategy.action === 'split' && hand.length === 2 && hand[0] === hand[1] && handResult === null) {
            handHTML += `
                <button onclick="splitHand(${handIndex})" class="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                    ✂️ Split Hand ${handIndex + 1}
                </button>
            `;
        }
        
        if (strategy.action === 'double' && !isDoubled && hand.length === 2 && handResult === null) {
            handHTML += `
                <button onclick="doubleDownSplit(${handIndex})" class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                    💰 Double Down Hand ${handIndex + 1}
                </button>
            `;
        }
        
        // Cash out button for split hands when surrender is recommended (2 or more cards)
        if (strategy.action === 'surrender' && hand.length >= 2 && handResult === null) {
            handHTML += `
                <button onclick="recordSplitSurrender(${handIndex})" class="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                    🏳️ Cash Out Hand ${handIndex + 1} (Surrender - Recommended)
                </button>
            `;
        }
        
        // Manual cash out button for split hands (when not recommended but hand has 2+ cards)
        if (strategy.action !== 'surrender' && hand.length >= 2 && handResult === null) {
            handHTML += `
                <button onclick="recordSplitSurrender(${handIndex})" class="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-semibold transition text-sm border-2 border-orange-400">
                    🏳️ Cash Out Hand ${handIndex + 1} (Surrender - Manual)
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
}

/**
 * Update strategy for single hand
 */
function updateSingleStrategyDisplay(strategyDisplay, strategyDetails, dealerCard) {
    const strategy = getStrategyRecommendation(gameState.playerCards, dealerCard, gameState.cardCounting);
    
    let strategyHTML = `
        <div class="text-4xl mb-2">${getActionEmoji(strategy.action)}</div>
        <div class="text-2xl font-bold ${strategy.color || 'text-white'} mb-2">${strategy.message}</div>
    `;
    
    // Show insurance recommendation if dealer shows Ace
    if (strategy.insurance) {
        strategyHTML += `
            <div class="mt-3 p-2 bg-white/10 border border-white/20 rounded-lg">
                <div class="text-sm font-semibold ${strategy.insurance.color} mb-1">${strategy.insurance.message}</div>
                <div class="text-xs text-green-200">${strategy.insurance.details}</div>
            </div>
        `;
    }
    
    // Manual split button - available for any pair, regardless of strategy
    const hasPair = gameState.playerCards.length === 2 && gameState.playerCards[0] === gameState.playerCards[1];
    if (hasPair && !gameState.isSplit) {
        if (strategy.action === 'split') {
            // Strategy recommends split
            strategyHTML += `
                <button onclick="splitHand()" class="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                    ✂️ Split Hand (Recommended)
                </button>
            `;
        } else {
            // Strategy doesn't recommend split, but show manual split option
            strategyHTML += `
                <button onclick="splitHand()" class="mt-2 w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg font-semibold transition text-sm border-2 border-purple-400">
                    ✂️ Manual Split (Not Recommended)
                </button>
            `;
        }
    }
    
    if (strategy.action === 'double' && !gameState.isDoubled && gameState.playerCards.length === 2) {
        strategyHTML += `
            <button onclick="doubleDown()" class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                💰 Double Down
            </button>
        `;
    }
    
    // Cash out button - always show when player has 2 or more cards
    if (gameState.playerCards.length >= 2 && !gameState.isSplit) {
        if (strategy.action === 'surrender') {
            // Strategy recommends surrender
            strategyHTML += `
                <button onclick="recordSurrender()" class="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg font-semibold transition text-sm">
                    🏳️ Cash Out (Surrender - Recommended)
                </button>
            `;
        } else {
            // Strategy doesn't recommend surrender, but show manual cash out option
            strategyHTML += `
                <button onclick="recordSurrender()" class="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-semibold transition text-sm border-2 border-orange-400">
                    🏳️ Cash Out (Surrender - Manual)
                </button>
            `;
        }
    }
    
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

/**
 * Update bet display
 */
function updateBetDisplay() {
    document.getElementById('currentBet').value = gameState.currentBet;
    document.getElementById('bankroll').value = gameState.bankroll;
    
    const playerCardButtons = document.getElementById('playerCardButtons');
    if (gameState.isSplit) {
        if (playerCardButtons) playerCardButtons.classList.add('hidden');
    } else {
        if (playerCardButtons) playerCardButtons.classList.remove('hidden');
    }
    
    const recordButtons = document.getElementById('recordButtons');
    if (recordButtons) {
        // Always show record buttons, including cash out/surrender
        recordButtons.style.display = 'flex';
    }
    
    // Update manual action buttons visibility
    updateManualActionButtons();
}

/**
 * Update manual action buttons visibility
 */
function updateManualActionButtons() {
    const manualSplitBtn = document.getElementById('manualSplitBtn');
    const manualSurrenderBtn = document.getElementById('manualSurrenderBtn');
    const manualSplitBtnTop = document.getElementById('manualSplitBtnTop');
    
    if (!manualSplitBtn || !manualSurrenderBtn) return;
    
    // Manual Split: Show when player has exactly 2 cards that are the same (pair) and not already split
    const hasPair = !gameState.isSplit && 
                    gameState.playerCards.length === 2 && 
                    gameState.playerCards[0] === gameState.playerCards[1];
    manualSplitBtn.style.display = hasPair ? 'block' : 'none';
    
    // Manual Split button in top right corner of player's hand
    if (manualSplitBtnTop) {
        manualSplitBtnTop.style.display = hasPair ? 'block' : 'none';
    }
    
    // Manual Surrender: Show when player has exactly 2 cards and not already split
    const canSurrender = !gameState.isSplit && gameState.playerCards.length === 2;
    manualSurrenderBtn.style.display = canSurrender ? 'block' : 'none';
}

/**
 * Update card counting display
 */
export function updateCardCountingDisplay() {
    const runningCount = gameState.cardCounting.runningCount;
    const cardsDealt = gameState.cardCounting.cardsDealt;
    const cardsRemaining = gameState.cardCounting.totalCards - cardsDealt;
    const decksRemaining = Math.max(0, cardsRemaining / 54);
    const trueCount = calculateTrueCount(gameState.cardCounting);
    const suggestedBet = getSuggestedBet(trueCount);
    
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

/**
 * Update statistics display
 */
export function updateStats() {
    document.getElementById('gamesPlayed').textContent = gameState.stats.gamesPlayed;
    
    const profit = gameState.stats.totalProfit >= 0 
        ? '$' + gameState.stats.totalProfit.toFixed(2)
        : '-$' + Math.abs(gameState.stats.totalProfit).toFixed(2);
    const profitElement = document.getElementById('totalProfit');
    profitElement.textContent = profit;
    profitElement.className = gameState.stats.totalProfit >= 0 
        ? 'text-white font-bold text-2xl text-green-300' 
        : 'text-white font-bold text-2xl text-red-300';
}

// ============================================================================
// GAME ACTIONS (Exported for HTML onclick handlers)
// ============================================================================

/**
 * Add card to hand (called from HTML)
 */
export function addCardToHand(hand, card) {
    addCard(gameState, hand, card);
    updateDisplay();
    saveState();
}
window.addCard = addCardToHand;

/**
 * Remove card from hand (called from HTML)
 */
export function removeCardFromHand(hand, index) {
    removeCard(gameState, hand, index);
    updateDisplay();
    saveState();
}
window.removeCard = removeCardFromHand;

/**
 * Clear hand (called from HTML)
 */
export function clearHandAction(hand) {
    clearHand(gameState, hand);
    updateDisplay();
    saveState();
}
window.clearHand = clearHandAction;

/**
 * Split hand (called from HTML)
 */
export function splitHandAction(handIndex = null) {
    splitHand(gameState, handIndex);
    updateDisplay();
    saveState();
}
window.splitHand = splitHandAction;

/**
 * Double down (called from HTML)
 */
export function doubleDownAction() {
    doubleDown(gameState);
    updateDisplay();
    saveState();
}
window.doubleDown = doubleDownAction;

/**
 * Double down for split hand (called from HTML)
 */
export function doubleDownSplitAction(handIndex) {
    doubleDownSplit(gameState, handIndex);
    updateDisplay();
    saveState();
}
window.doubleDownSplit = doubleDownSplitAction;

/**
 * New hand
 */
export function newHand() {
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
window.newHand = newHand;

/**
 * Clear all
 */
export function clearAll() {
    if (confirm('Are you sure you want to clear everything? This will reset statistics without saving to history.')) {
        resetCardCount(gameState.cardCounting);
        resetGameState(gameState);
        
        const useSuggestedBetCheckbox = document.getElementById('useSuggestedBet');
        if (useSuggestedBetCheckbox) {
            useSuggestedBetCheckbox.checked = false;
        }
        
        updateDisplay();
        saveState();
    }
}
window.clearAll = clearAll;

/**
 * Record win
 */
export function recordWinAction() {
    recordWin(gameState, () => getEffectiveBet(gameState, document.getElementById('useSuggestedBet')?.checked || false));
    updateDisplay();
    saveState();
}
window.recordWin = recordWinAction;

/**
 * Record push
 */
export function recordPushAction() {
    recordPush(gameState);
    updateDisplay();
    saveState();
}
window.recordPush = recordPushAction;

/**
 * Record loss
 */
export function recordLossAction() {
    recordLoss(gameState, () => getEffectiveBet(gameState, document.getElementById('useSuggestedBet')?.checked || false));
    updateDisplay();
    saveState();
}
window.recordLoss = recordLossAction;

/**
 * Record surrender (cashout)
 */
export function recordSurrenderAction() {
    recordSurrender(gameState, () => getEffectiveBet(gameState, document.getElementById('useSuggestedBet')?.checked || false));
    updateDisplay();
    saveState();
}
window.recordSurrender = recordSurrenderAction;

/**
 * Record split result (called from HTML)
 */
export function recordSplitResultAction(handIndex, result) {
    recordSplitResult(gameState, handIndex, result, () => getEffectiveBet(gameState, document.getElementById('useSuggestedBet')?.checked || false));
    updateDisplay();
    saveState();
}
window.recordSplitResult = recordSplitResultAction;

/**
 * Record split hand surrender (called from HTML)
 */
export function recordSplitSurrenderAction(handIndex) {
    recordSplitSurrender(gameState, handIndex, () => getEffectiveBet(gameState, document.getElementById('useSuggestedBet')?.checked || false));
    updateDisplay();
    saveState();
}
window.recordSplitSurrender = recordSplitSurrenderAction;

/**
 * Adjust bet
 */
export function adjustBetAction(amount) {
    adjustBet(gameState, amount);
    updateDisplay();
    saveState();
}
window.adjustBet = adjustBetAction;

/**
 * Set bet
 */
export function setBetAction(amount) {
    setBet(gameState, amount);
    updateDisplay();
    saveState();
}
window.setBet = setBetAction;

/**
 * Reset stats
 */
export async function resetStats() {
    if (confirm('Are you sure you want to reset all statistics? The current stats will be saved to history.')) {
        if (gameState.stats.gamesPlayed > 0) {
            try {
                await saveStatsRecord(gameState.stats);
                alert('Statistics saved to history!');
                loadStatsHistory();
            } catch (error) {
                console.error('Failed to save statistics:', error);
                alert('Warning: Failed to save statistics to history. Stats will still be reset.');
            }
        }
        
        resetStatsState(gameState);
        updateDisplay();
        saveState();
    }
}
window.resetStats = resetStats;

/**
 * Reset card count
 */
export function resetCardCountAction() {
    resetCardCount(gameState.cardCounting);
    updateDisplay();
    saveState();
}
window.resetCardCount = resetCardCountAction;

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

/**
 * Switch tab
 */
export function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
        button.classList.remove('text-white', 'border-green-400');
        button.classList.add('text-green-200', 'border-transparent');
    });
    
    const selectedContent = document.getElementById(`tab-content-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    const selectedButton = document.getElementById(`tab-${tabName}`);
    if (selectedButton) {
        selectedButton.classList.add('active');
        selectedButton.classList.remove('text-green-200', 'border-transparent');
        selectedButton.classList.add('text-white', 'border-green-400');
    }
    
    if (tabName === 'history') {
        loadStatsHistory();
    }
}
window.switchTab = switchTab;

// ============================================================================
// STATISTICS HISTORY
// ============================================================================

/**
 * Load and display statistics history
 */
export async function loadStatsHistory() {
    const records = await getAllStatsRecords();
    const historyContainer = document.getElementById('statsHistory');
    const summaryContainer = document.getElementById('historySummary');
    
    if (!historyContainer) return;
    
    const totalGames = records.reduce((sum, record) => sum + (record.gamesPlayed || 0), 0);
    const totalProfit = records.reduce((sum, record) => sum + (record.totalProfit || 0), 0);
    
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

/**
 * Delete stats record by ID (called from HTML)
 */
export async function deleteStatsRecordById(id) {
    if (confirm('Are you sure you want to delete this statistics record?')) {
        const success = await deleteStatsRecord(id);
        if (success) {
            loadStatsHistory();
        } else {
            alert('Failed to delete record');
        }
    }
}
window.deleteStatsRecordById = deleteStatsRecordById;

/**
 * Export stats records
 */
export async function exportStatsRecordsAction() {
    try {
        const records = await exportStatsRecords();
        if (records) {
            console.log('Exported', records.length, 'records');
        }
    } catch (error) {
        console.error('Error exporting records:', error);
    }
}
window.exportStatsRecords = exportStatsRecordsAction;
window.exportStatsRecordsAction = exportStatsRecordsAction;

/**
 * Import stats records
 */
export async function importStatsRecordsAction(file) {
    if (file) {
        try {
            const imported = await importStatsRecords(file);
            if (imported) {
                alert(`Successfully imported ${imported} records!`);
                loadStatsHistory();
            }
        } catch (error) {
            console.error('Error importing records:', error);
        }
    }
}
window.importStatsRecords = importStatsRecordsAction;
window.importStatsRecordsAction = importStatsRecordsAction;

/**
 * Clear all stats records
 */
export async function clearAllStatsRecordsAction() {
    if (confirm('Are you sure you want to delete ALL saved statistics records? This cannot be undone.')) {
        const success = await clearAllStatsRecords();
        if (success) {
            loadStatsHistory();
            alert('All statistics records have been deleted');
        } else {
            alert('Failed to clear records');
        }
    }
}
window.clearAllStatsRecords = clearAllStatsRecordsAction;

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

/**
 * Save state to localStorage
 */
export function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(gameState));
}

/**
 * Load state from localStorage
 */
export function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        try {
            const loadedState = JSON.parse(saved);
            gameState = {
                ...createInitialGameState(),
                ...loadedState,
                cardCounting: loadedState.cardCounting || createInitialGameState().cardCounting,
                stats: loadedState.stats || createInitialGameState().stats,
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

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
async function init() {
    await initDB();
    loadState();
    updateDisplay();
    
    // Set up event listeners
    document.getElementById('currentBet').addEventListener('change', (e) => {
        const value = parseInt(e.target.value) || 1;
        setBet(gameState, Math.max(1, value));
        updateDisplay();
        saveState();
    });
    
    document.getElementById('bankroll').addEventListener('change', (e) => {
        const value = parseInt(e.target.value) || 0;
        gameState.bankroll = Math.max(0, value);
        updateDisplay();
        saveState();
    });
}

// Expose utility functions to window (these are imported, not defined here)
window.getDatabaseStats = getDatabaseStats;
window.getAllStatsRecords = getAllStatsRecords;

// Initialize when DOM is ready
// Use a small delay to ensure all window assignments are complete
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure module is fully loaded
        setTimeout(init, 0);
    });
} else {
    setTimeout(init, 0);
}

