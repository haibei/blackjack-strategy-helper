/**
 * Unit tests for Game Logic
 */

import { 
  addCard, 
  removeCard, 
  clearHand, 
  splitHand, 
  doubleDown, 
  doubleDownSplit,
  recordWin,
  recordPush,
  recordLoss,
  recordSplitResult
} from '../js/gameLogic.js';
import { createInitialGameState } from '../js/gameState.js';

describe('Game Logic', () => {
  let gameState;

  beforeEach(() => {
    gameState = createInitialGameState();
  });

  describe('addCard', () => {
    test('should add card to dealer hand', () => {
      addCard(gameState, 'dealer', 'A');
      expect(gameState.dealerCards).toEqual(['A']);
      
      addCard(gameState, 'dealer', '10');
      expect(gameState.dealerCards).toEqual(['A', '10']);
    });

    test('should add card to player hand', () => {
      addCard(gameState, 'player', '10');
      expect(gameState.playerCards).toEqual(['10']);
      
      addCard(gameState, 'player', '5');
      expect(gameState.playerCards).toEqual(['10', '5']);
    });

    test('should add card to split hand when split', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      
      addCard(gameState, 'player', '5');
      
      // Should add to the hand with fewer cards
      expect(gameState.splitHands[0].length).toBe(2);
      expect(gameState.splitHands[1].length).toBe(1);
    });

    test('should add card to specific split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      
      addCard(gameState, 'split-0', '5');
      expect(gameState.splitHands[0]).toEqual(['10', '5']);
      
      addCard(gameState, 'split-1', '6');
      expect(gameState.splitHands[1]).toEqual(['10', '6']);
    });

    test('should update card count when adding card', () => {
      const initialCount = gameState.cardCounting.runningCount;
      addCard(gameState, 'player', '5');
      
      expect(gameState.cardCounting.runningCount).not.toBe(initialCount);
    });
  });

  describe('removeCard', () => {
    test('should remove card from dealer hand', () => {
      gameState.dealerCards = ['A', '10', '5'];
      removeCard(gameState, 'dealer', 1);
      
      expect(gameState.dealerCards).toEqual(['A', '5']);
    });

    test('should remove card from player hand', () => {
      gameState.playerCards = ['10', '5', '3'];
      removeCard(gameState, 'player', 1);
      
      expect(gameState.playerCards).toEqual(['10', '3']);
    });

    test('should remove card from split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10', '5'], ['10', '6']];
      
      removeCard(gameState, 'split-0', 1);
      expect(gameState.splitHands[0]).toEqual(['10']);
    });

    test('should update card count when removing card', () => {
      gameState.playerCards = ['5'];
      gameState.cardCounting.runningCount = 1;
      gameState.cardCounting.cardsDealt = 1; // Must set cardsDealt for remove to work
      
      removeCard(gameState, 'player', 0);
      
      expect(gameState.cardCounting.runningCount).toBe(0);
      expect(gameState.cardCounting.cardsDealt).toBe(0);
    });
  });

  describe('clearHand', () => {
    test('should clear dealer hand', () => {
      gameState.dealerCards = ['A', '10', '5'];
      clearHand(gameState, 'dealer');
      
      expect(gameState.dealerCards).toEqual([]);
    });

    test('should clear player hand and reset split state', () => {
      gameState.playerCards = ['10', '10'];
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = ['win', null];
      gameState.isDoubled = true;
      gameState.splitHandDoubled = [false, true];
      
      clearHand(gameState, 'player');
      
      expect(gameState.playerCards).toEqual([]);
      expect(gameState.isSplit).toBe(false);
      expect(gameState.splitHands).toEqual([]);
      expect(gameState.splitHandResults).toEqual([]);
      expect(gameState.isDoubled).toBe(false);
      expect(gameState.splitHandDoubled).toEqual([]);
    });

    test('should clear specific split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10', '5'], ['10', '6']];
      gameState.splitHandResults = [null, null];
      gameState.splitHandDoubled = [false, false];
      
      clearHand(gameState, 'split-0');
      
      expect(gameState.splitHands[0]).toEqual([]);
      expect(gameState.splitHandResults[0]).toBe(null);
      expect(gameState.splitHandDoubled[0]).toBe(false);
      expect(gameState.splitHands[1]).toEqual(['10', '6']);
    });
  });

  describe('splitHand', () => {
    test('should split matching player cards', () => {
      gameState.playerCards = ['10', '10'];
      splitHand(gameState);
      
      expect(gameState.isSplit).toBe(true);
      expect(gameState.playerCards).toEqual([]);
      expect(gameState.splitHands).toEqual([['10'], ['10']]);
      expect(gameState.splitHandResults).toEqual([null, null]);
      expect(gameState.splitHandDoubled).toEqual([false, false]);
    });

    test('should not split non-matching cards', () => {
      gameState.playerCards = ['10', '5'];
      splitHand(gameState);
      
      expect(gameState.isSplit).toBe(false);
      expect(gameState.playerCards).toEqual(['10', '5']);
    });

    test('should not split if not exactly 2 cards', () => {
      gameState.playerCards = ['10'];
      splitHand(gameState);
      expect(gameState.isSplit).toBe(false);
      
      gameState.playerCards = ['10', '10', '5'];
      splitHand(gameState);
      expect(gameState.isSplit).toBe(false);
    });

    test('should split existing split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10', '10'], ['5']];
      gameState.splitHandResults = [null, null];
      gameState.splitHandDoubled = [false, false];
      
      splitHand(gameState, 0);
      
      expect(gameState.splitHands.length).toBe(3);
      expect(gameState.splitHands[0]).toEqual(['10']); // Original hand 0, now split
      expect(gameState.splitHands[1]).toEqual(['5']); // Original hand 1, unchanged
      expect(gameState.splitHands[2]).toEqual(['10']); // New split hand from hand 0
      expect(gameState.splitHandResults.length).toBe(3);
      expect(gameState.splitHandDoubled.length).toBe(3);
    });
  });

  describe('doubleDown', () => {
    test('should set isDoubled for 2-card hand', () => {
      gameState.playerCards = ['10', '5'];
      doubleDown(gameState);
      
      expect(gameState.isDoubled).toBe(true);
    });

    test('should not double if split', () => {
      gameState.isSplit = true;
      gameState.playerCards = ['10', '5'];
      doubleDown(gameState);
      
      expect(gameState.isDoubled).toBe(false);
    });

    test('should not double if not exactly 2 cards', () => {
      gameState.playerCards = ['10'];
      doubleDown(gameState);
      expect(gameState.isDoubled).toBe(false);
      
      gameState.playerCards = ['10', '5', '3'];
      doubleDown(gameState);
      expect(gameState.isDoubled).toBe(false);
    });
  });

  describe('doubleDownSplit', () => {
    test('should double down on split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10', '5'], ['10', '6']];
      gameState.splitHandResults = [null, null];
      gameState.splitHandDoubled = [false, false]; // Initialize array
      
      doubleDownSplit(gameState, 0);
      
      expect(gameState.splitHandDoubled[0]).toBe(true);
      expect(gameState.splitHandDoubled[1]).toBe(false);
    });

    test('should not double if hand already has result', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10', '5'], ['10', '6']];
      gameState.splitHandResults = ['win', null];
      gameState.splitHandDoubled = [false, false]; // Initialize array
      
      doubleDownSplit(gameState, 0);
      
      expect(gameState.splitHandDoubled[0]).toBe(false);
    });
  });

  describe('recordWin', () => {
    test('should record win with standard payout', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['10', '5'];
      const getEffectiveBet = () => 10;
      
      recordWin(gameState, getEffectiveBet);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.wins).toBe(1);
      expect(gameState.stats.totalProfit).toBe(10);
      expect(gameState.bankroll).toBe(1010);
    });

    test('should record win with blackjack payout (1.5x)', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['A', 'K'];
      const getEffectiveBet = () => 10;
      
      recordWin(gameState, getEffectiveBet);
      
      expect(gameState.stats.totalProfit).toBe(15);
      expect(gameState.bankroll).toBe(1015);
    });

    test('should record win with double down payout (2x)', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['10', '5'];
      gameState.isDoubled = true;
      const getEffectiveBet = () => 10;
      
      recordWin(gameState, getEffectiveBet);
      
      expect(gameState.stats.totalProfit).toBe(20);
      expect(gameState.bankroll).toBe(1020);
    });

    test('should clear hands after win', () => {
      gameState.dealerCards = ['A'];
      gameState.playerCards = ['10', '10'];
      const getEffectiveBet = () => 10;
      
      recordWin(gameState, getEffectiveBet);
      
      expect(gameState.dealerCards).toEqual([]);
      expect(gameState.playerCards).toEqual([]);
      expect(gameState.isDoubled).toBe(false);
    });

    test('should not record win if split', () => {
      gameState.isSplit = true;
      gameState.stats.gamesPlayed = 0;
      const getEffectiveBet = () => 10;
      
      recordWin(gameState, getEffectiveBet);
      
      expect(gameState.stats.gamesPlayed).toBe(0);
    });
  });

  describe('recordPush', () => {
    test('should record push', () => {
      recordPush(gameState);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.pushes).toBe(1);
      expect(gameState.stats.totalProfit).toBe(0);
    });

    test('should clear hands after push', () => {
      gameState.dealerCards = ['10'];
      gameState.playerCards = ['10', '10'];
      
      recordPush(gameState);
      
      expect(gameState.dealerCards).toEqual([]);
      expect(gameState.playerCards).toEqual([]);
      expect(gameState.isDoubled).toBe(false);
    });

    test('should not record push if split', () => {
      gameState.isSplit = true;
      gameState.stats.gamesPlayed = 0;
      
      recordPush(gameState);
      
      expect(gameState.stats.gamesPlayed).toBe(0);
    });
  });

  describe('recordLoss', () => {
    test('should record loss', () => {
      gameState.currentBet = 10;
      gameState.bankroll = 1000;
      const getEffectiveBet = () => 10;
      
      recordLoss(gameState, getEffectiveBet);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.losses).toBe(1);
      expect(gameState.stats.totalProfit).toBe(-10);
      expect(gameState.bankroll).toBe(990);
    });

    test('should record loss with double down (2x)', () => {
      gameState.currentBet = 10;
      gameState.isDoubled = true;
      gameState.bankroll = 1000;
      const getEffectiveBet = () => 10;
      
      recordLoss(gameState, getEffectiveBet);
      
      expect(gameState.stats.totalProfit).toBe(-20);
      expect(gameState.bankroll).toBe(980);
    });

    test('should not allow negative bankroll', () => {
      gameState.currentBet = 1500;
      gameState.bankroll = 1000;
      const getEffectiveBet = () => 1500;
      
      recordLoss(gameState, getEffectiveBet);
      
      expect(gameState.bankroll).toBe(0);
    });

    test('should clear hands after loss', () => {
      gameState.dealerCards = ['10', '10'];
      gameState.playerCards = ['10', '5'];
      const getEffectiveBet = () => 10;
      
      recordLoss(gameState, getEffectiveBet);
      
      expect(gameState.dealerCards).toEqual([]);
      expect(gameState.playerCards).toEqual([]);
      expect(gameState.isDoubled).toBe(false);
    });

    test('should not record loss if split', () => {
      gameState.isSplit = true;
      gameState.stats.gamesPlayed = 0;
      const getEffectiveBet = () => 10;
      
      recordLoss(gameState, getEffectiveBet);
      
      expect(gameState.stats.gamesPlayed).toBe(0);
    });
  });

  describe('recordSplitResult', () => {
    test('should record win for split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      gameState.splitHandDoubled = [false, false];
      gameState.currentBet = 10;
      const getEffectiveBet = () => 10;
      
      recordSplitResult(gameState, 0, 'win', getEffectiveBet);
      
      expect(gameState.stats.wins).toBe(1);
      expect(gameState.stats.totalProfit).toBe(10);
      expect(gameState.bankroll).toBe(1010);
      expect(gameState.splitHandResults[0]).toBe('win');
    });

    test('should record loss for split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      gameState.currentBet = 10;
      gameState.bankroll = 1000;
      const getEffectiveBet = () => 10;
      
      recordSplitResult(gameState, 0, 'loss', getEffectiveBet);
      
      expect(gameState.stats.losses).toBe(1);
      expect(gameState.stats.totalProfit).toBe(-10);
      expect(gameState.bankroll).toBe(990);
      expect(gameState.splitHandResults[0]).toBe('loss');
    });

    test('should record push for split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      const getEffectiveBet = () => 10;
      
      recordSplitResult(gameState, 0, 'push', getEffectiveBet);
      
      expect(gameState.stats.pushes).toBe(1);
      expect(gameState.stats.totalProfit).toBe(0);
      expect(gameState.splitHandResults[0]).toBe('push');
    });

    test('should handle doubled split hand', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      gameState.splitHandDoubled = [true, false];
      gameState.currentBet = 10;
      gameState.bankroll = 1000;
      const getEffectiveBet = () => 10;
      
      recordSplitResult(gameState, 0, 'win', getEffectiveBet);
      
      expect(gameState.stats.totalProfit).toBe(20);
      expect(gameState.bankroll).toBe(1020);
    });

    test('should complete game when all split hands recorded', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      gameState.dealerCards = ['A'];
      const getEffectiveBet = () => 10;
      
      recordSplitResult(gameState, 0, 'win', getEffectiveBet);
      recordSplitResult(gameState, 1, 'loss', getEffectiveBet);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.isSplit).toBe(false);
      expect(gameState.splitHands).toEqual([]);
      expect(gameState.splitHandResults).toEqual([]);
      expect(gameState.dealerCards).toEqual([]);
    });

    test('should not record if hand already has result', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = ['win', null];
      gameState.stats.wins = 1;
      const getEffectiveBet = () => 10;
      
      recordSplitResult(gameState, 0, 'loss', getEffectiveBet);
      
      expect(gameState.stats.wins).toBe(1);
      expect(gameState.stats.losses).toBe(0);
    });

    test('should not record if invalid hand index', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10']];
      gameState.stats.wins = 0;
      const getEffectiveBet = () => 10;
      
      recordSplitResult(gameState, 5, 'win', getEffectiveBet);
      
      expect(gameState.stats.wins).toBe(0);
    });
  });
});

