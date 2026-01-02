/**
 * Unit tests for Statistics functionality
 */

import { createInitialGameState } from '../js/gameState.js';
import { recordWin, recordLoss, recordPush, recordSplitResult } from '../js/gameLogic.js';
import { getEffectiveBet } from '../js/betManagement.js';

describe('Statistics Tests', () => {
  let gameState;

  beforeEach(() => {
    gameState = createInitialGameState();
  });

  describe('Win Rate Calculation', () => {
    test('should calculate win rate correctly', () => {
      gameState.stats.gamesPlayed = 100;
      gameState.stats.wins = 45;
      
      const winRate = gameState.stats.gamesPlayed > 0 
        ? ((gameState.stats.wins / gameState.stats.gamesPlayed) * 100).toFixed(1)
        : 0;
      
      expect(parseFloat(winRate)).toBe(45.0);
    });

    test('should return 0 when no games played', () => {
      gameState.stats.gamesPlayed = 0;
      
      const winRate = gameState.stats.gamesPlayed > 0 
        ? ((gameState.stats.wins / gameState.stats.gamesPlayed) * 100).toFixed(1)
        : 0;
      
      expect(parseFloat(winRate)).toBe(0);
    });

    test('should handle 100% win rate', () => {
      gameState.stats.gamesPlayed = 10;
      gameState.stats.wins = 10;
      
      const winRate = gameState.stats.gamesPlayed > 0 
        ? ((gameState.stats.wins / gameState.stats.gamesPlayed) * 100).toFixed(1)
        : 0;
      
      expect(parseFloat(winRate)).toBe(100.0);
    });
  });

  describe('Profit Calculation', () => {
    test('should calculate profit for regular win', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['10', '5'];
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordWin(gameState, getEffectiveBetFn);
      
      expect(gameState.stats.totalProfit).toBe(10);
    });

    test('should calculate profit for blackjack (1.5x)', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['A', 'K'];
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordWin(gameState, getEffectiveBetFn);
      
      expect(gameState.stats.totalProfit).toBe(15);
    });

    test('should calculate profit for doubled down win (2x)', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['10', '5'];
      gameState.isDoubled = true;
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordWin(gameState, getEffectiveBetFn);
      
      expect(gameState.stats.totalProfit).toBe(20);
    });

    test('should subtract loss from profit', () => {
      gameState.stats.totalProfit = 50;
      gameState.currentBet = 10;
      gameState.playerCards = ['10', '5'];
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordLoss(gameState, getEffectiveBetFn);
      
      expect(gameState.stats.totalProfit).toBe(40);
    });

    test('should handle negative profit', () => {
      gameState.stats.totalProfit = 10;
      gameState.currentBet = 20;
      gameState.playerCards = ['10', '5'];
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordLoss(gameState, getEffectiveBetFn);
      
      expect(gameState.stats.totalProfit).toBe(-10);
    });
  });

  describe('Game Statistics', () => {
    test('should increment games played on win', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['10', '10'];
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordWin(gameState, getEffectiveBetFn);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.wins).toBe(1);
    });

    test('should increment games played on loss', () => {
      gameState.currentBet = 10;
      gameState.playerCards = ['10', '5'];
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordLoss(gameState, getEffectiveBetFn);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.losses).toBe(1);
    });

    test('should increment games played on push', () => {
      recordPush(gameState);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.pushes).toBe(1);
    });

    test('should track multiple games correctly', () => {
      gameState.currentBet = 10;
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      // 5 wins
      for (let i = 0; i < 5; i++) {
        gameState.playerCards = ['10', '10'];
        recordWin(gameState, getEffectiveBetFn);
      }
      
      // 3 losses
      for (let i = 0; i < 3; i++) {
        gameState.playerCards = ['10', '5'];
        recordLoss(gameState, getEffectiveBetFn);
      }
      
      // 2 pushes
      for (let i = 0; i < 2; i++) {
        recordPush(gameState);
      }
      
      expect(gameState.stats.gamesPlayed).toBe(10);
      expect(gameState.stats.wins).toBe(5);
      expect(gameState.stats.losses).toBe(3);
      expect(gameState.stats.pushes).toBe(2);
    });
  });

  describe('Split Hand Statistics', () => {
    test('should record split hand results correctly', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      gameState.currentBet = 10;
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordSplitResult(gameState, 0, 'win', getEffectiveBetFn);
      recordSplitResult(gameState, 1, 'loss', getEffectiveBetFn);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.wins).toBe(1);
      expect(gameState.stats.losses).toBe(1);
      expect(gameState.stats.totalProfit).toBe(0); // Win 10, lose 10
    });

    test('should handle split hand with push', () => {
      gameState.isSplit = true;
      gameState.splitHands = [['10'], ['10']];
      gameState.splitHandResults = [null, null];
      gameState.currentBet = 10;
      const getEffectiveBetFn = () => getEffectiveBet(gameState, false);
      
      recordSplitResult(gameState, 0, 'win', getEffectiveBetFn);
      recordSplitResult(gameState, 1, 'push', getEffectiveBetFn);
      
      expect(gameState.stats.gamesPlayed).toBe(1);
      expect(gameState.stats.wins).toBe(1);
      expect(gameState.stats.pushes).toBe(1);
      expect(gameState.stats.totalProfit).toBe(10);
    });
  });
});
