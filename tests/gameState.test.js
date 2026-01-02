/**
 * Unit tests for Game State Management
 */

import { createInitialGameState, resetGameState, resetStats } from '../js/gameState.js';

describe('Game State Management', () => {
  describe('createInitialGameState', () => {
    test('should create initial game state with default values', () => {
      const state = createInitialGameState();
      
      expect(state.dealerCards).toEqual([]);
      expect(state.playerCards).toEqual([]);
      expect(state.currentBet).toBe(1);
      expect(state.bankroll).toBe(1000);
      expect(state.isSplit).toBe(false);
      expect(state.splitHands).toEqual([]);
      expect(state.splitHandResults).toEqual([]);
      expect(state.isDoubled).toBe(false);
      expect(state.splitHandDoubled).toEqual([]);
      
      expect(state.cardCounting).toEqual({
        runningCount: 0,
        cardsDealt: 0,
        initialDecks: 8,
        totalCards: 432
      });
      
      expect(state.stats).toEqual({
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalProfit: 0
      });
    });
  });

  describe('resetGameState', () => {
    test('should reset all game state fields', () => {
      const state = createInitialGameState();
      
      // Modify state
      state.dealerCards = ['A', 'K'];
      state.playerCards = ['10', '10'];
      state.currentBet = 50;
      state.isSplit = true;
      state.splitHands = [['10'], ['10']];
      state.splitHandResults = ['win', 'loss'];
      state.isDoubled = true;
      state.splitHandDoubled = [true, false];
      state.cardCounting.runningCount = 5;
      state.cardCounting.cardsDealt = 10;
      state.stats.gamesPlayed = 5;
      state.stats.wins = 3;
      state.stats.losses = 2;
      state.stats.totalProfit = 100;
      
      resetGameState(state);
      
      expect(state.dealerCards).toEqual([]);
      expect(state.playerCards).toEqual([]);
      expect(state.currentBet).toBe(1);
      expect(state.isSplit).toBe(false);
      expect(state.splitHands).toEqual([]);
      expect(state.splitHandResults).toEqual([]);
      expect(state.isDoubled).toBe(false);
      expect(state.splitHandDoubled).toEqual([]);
      expect(state.cardCounting.runningCount).toBe(0);
      expect(state.cardCounting.cardsDealt).toBe(0);
      expect(state.stats).toEqual({
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalProfit: 0
      });
    });

    test('should preserve cardCounting structure', () => {
      const state = createInitialGameState();
      resetGameState(state);
      
      expect(state.cardCounting).toHaveProperty('runningCount');
      expect(state.cardCounting).toHaveProperty('cardsDealt');
      expect(state.cardCounting).toHaveProperty('initialDecks');
      expect(state.cardCounting).toHaveProperty('totalCards');
    });

    test('should return the game state object', () => {
      const state = createInitialGameState();
      const result = resetGameState(state);
      
      expect(result).toBe(state);
    });
  });

  describe('resetStats', () => {
    test('should reset only statistics', () => {
      const state = createInitialGameState();
      
      // Modify stats
      state.stats.gamesPlayed = 10;
      state.stats.wins = 6;
      state.stats.losses = 3;
      state.stats.pushes = 1;
      state.stats.totalProfit = 500;
      
      // Keep other fields
      state.dealerCards = ['A'];
      state.playerCards = ['10', '10'];
      state.currentBet = 25;
      
      resetStats(state);
      
      expect(state.stats).toEqual({
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalProfit: 0
      });
      
      // Other fields should remain unchanged
      expect(state.dealerCards).toEqual(['A']);
      expect(state.playerCards).toEqual(['10', '10']);
      expect(state.currentBet).toBe(25);
    });

    test('should return the game state object', () => {
      const state = createInitialGameState();
      const result = resetStats(state);
      
      expect(result).toBe(state);
    });
  });
});

