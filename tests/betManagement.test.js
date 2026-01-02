/**
 * Unit tests for Bet Management
 */

// Mock card counting functions BEFORE imports
jest.mock('../js/cardCounting.js', () => ({
  calculateTrueCount: jest.fn(),
  getSuggestedBet: jest.fn(),
  updateCardCount: jest.fn(),
  resetCardCount: jest.fn()
}));

import { getEffectiveBet, adjustBet, setBet } from '../js/betManagement.js';
import { createInitialGameState } from '../js/gameState.js';
import { calculateTrueCount, getSuggestedBet } from '../js/cardCounting.js';

describe('Bet Management', () => {
  let gameState;

  beforeEach(() => {
    gameState = createInitialGameState();
    jest.clearAllMocks();
  });

  describe('getEffectiveBet', () => {
    test('should return current bet when useSuggestedBet is false', () => {
      gameState.currentBet = 25;
      
      const result = getEffectiveBet(gameState, false);
      
      expect(result).toBe(25);
      expect(calculateTrueCount).not.toHaveBeenCalled();
    });

    test('should return suggested bet when useSuggestedBet is true', () => {
      gameState.currentBet = 25;
      calculateTrueCount.mockReturnValue(3);
      getSuggestedBet.mockReturnValue({ bet: 100, message: 'High count' });
      
      const result = getEffectiveBet(gameState, true);
      
      expect(result).toBe(100);
      expect(calculateTrueCount).toHaveBeenCalledWith(gameState.cardCounting);
      expect(getSuggestedBet).toHaveBeenCalledWith(3);
    });

    test('should use current bet when checkbox is unchecked', () => {
      gameState.currentBet = 50;
      
      const result = getEffectiveBet(gameState, false);
      
      expect(result).toBe(50);
    });

    test('should use suggested bet when checkbox is checked', () => {
      gameState.currentBet = 50;
      calculateTrueCount.mockReturnValue(2);
      getSuggestedBet.mockReturnValue({ bet: 200, message: 'Medium count' });
      
      const result = getEffectiveBet(gameState, true);
      
      expect(result).toBe(200);
    });
  });

  describe('adjustBet', () => {
    test('should increase bet by positive amount', () => {
      gameState.currentBet = 10;
      adjustBet(gameState, 5);
      
      expect(gameState.currentBet).toBe(15);
    });

    test('should decrease bet by negative amount', () => {
      gameState.currentBet = 20;
      adjustBet(gameState, -5);
      
      expect(gameState.currentBet).toBe(15);
    });

    test('should not allow bet below 1', () => {
      gameState.currentBet = 5;
      adjustBet(gameState, -10);
      
      expect(gameState.currentBet).toBe(1);
    });

    test('should allow bet of exactly 1', () => {
      gameState.currentBet = 2;
      adjustBet(gameState, -1);
      
      expect(gameState.currentBet).toBe(1);
    });

    test('should handle large adjustments', () => {
      gameState.currentBet = 10;
      adjustBet(gameState, 100);
      
      expect(gameState.currentBet).toBe(110);
    });

    test('should handle negative adjustments that would go below 1', () => {
      gameState.currentBet = 3;
      adjustBet(gameState, -5);
      
      expect(gameState.currentBet).toBe(1);
    });
  });

  describe('setBet', () => {
    test('should set bet to valid amount', () => {
      setBet(gameState, 50);
      
      expect(gameState.currentBet).toBe(50);
    });

    test('should set bet to minimum of 1', () => {
      setBet(gameState, 1);
      
      expect(gameState.currentBet).toBe(1);
    });

    test('should not set bet below 1', () => {
      gameState.currentBet = 10;
      setBet(gameState, 0);
      
      expect(gameState.currentBet).toBe(10); // Unchanged
    });

    test('should not set bet to negative', () => {
      gameState.currentBet = 10;
      setBet(gameState, -5);
      
      expect(gameState.currentBet).toBe(10); // Unchanged
    });

    test('should handle large bet amounts', () => {
      setBet(gameState, 1000);
      
      expect(gameState.currentBet).toBe(1000);
    });

    test('should handle decimal amounts (should be floored)', () => {
      setBet(gameState, 25.7);
      
      expect(gameState.currentBet).toBe(25.7);
    });
  });
});

