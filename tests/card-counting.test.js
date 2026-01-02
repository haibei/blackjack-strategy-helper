/**
 * Unit tests for Card Counting functionality
 */

import { updateCardCount, calculateTrueCount, getSuggestedBet, resetCardCount } from '../js/cardCounting.js';
import { createInitialGameState } from '../js/gameState.js';

describe('Card Counting Tests', () => {
  let cardCounting;

  beforeEach(() => {
    const gameState = createInitialGameState();
    cardCounting = gameState.cardCounting;
  });

  describe('updateCardCount', () => {
    test('should increase count when low cards are added', () => {
      updateCardCount(cardCounting, '5', 'add');
      expect(cardCounting.runningCount).toBe(1);
      expect(cardCounting.cardsDealt).toBe(1);
      
      updateCardCount(cardCounting, '2', 'add');
      expect(cardCounting.runningCount).toBe(2);
      expect(cardCounting.cardsDealt).toBe(2);
    });

    test('should decrease count when high cards are added', () => {
      updateCardCount(cardCounting, 'K', 'add');
      expect(cardCounting.runningCount).toBe(-1);
      expect(cardCounting.cardsDealt).toBe(1);
      
      updateCardCount(cardCounting, 'A', 'add');
      expect(cardCounting.runningCount).toBe(-2);
      expect(cardCounting.cardsDealt).toBe(2);
    });

    test('should not change count for neutral cards', () => {
      updateCardCount(cardCounting, '7', 'add');
      expect(cardCounting.runningCount).toBe(0);
      expect(cardCounting.cardsDealt).toBe(1);
      
      updateCardCount(cardCounting, '8', 'add');
      expect(cardCounting.runningCount).toBe(0);
      expect(cardCounting.cardsDealt).toBe(2);
    });

    test('should decrease count when removing low cards', () => {
      updateCardCount(cardCounting, '5', 'add');
      updateCardCount(cardCounting, '3', 'add');
      expect(cardCounting.runningCount).toBe(2);
      
      updateCardCount(cardCounting, '5', 'remove');
      expect(cardCounting.runningCount).toBe(1);
      expect(cardCounting.cardsDealt).toBe(1);
    });

    test('should increase count when removing high cards', () => {
      updateCardCount(cardCounting, 'K', 'add');
      updateCardCount(cardCounting, 'Q', 'add');
      expect(cardCounting.runningCount).toBe(-2);
      
      updateCardCount(cardCounting, 'K', 'remove');
      expect(cardCounting.runningCount).toBe(-1);
      expect(cardCounting.cardsDealt).toBe(1);
    });

    test('should not allow cardsDealt to go below 0', () => {
      updateCardCount(cardCounting, '5', 'remove');
      expect(cardCounting.cardsDealt).toBe(0);
      expect(cardCounting.runningCount).toBe(0);
    });

    test('should handle unknown cards gracefully', () => {
      updateCardCount(cardCounting, 'X', 'add');
      expect(cardCounting.runningCount).toBe(0);
      expect(cardCounting.cardsDealt).toBe(1);
    });
  });

  describe('calculateTrueCount', () => {
    test('should calculate True Count correctly', () => {
      cardCounting.runningCount = 10;
      cardCounting.cardsDealt = 108; // 2 decks dealt, 6 decks remaining
      
      const trueCount = calculateTrueCount(cardCounting);
      
      expect(trueCount).toBeCloseTo(1.67, 1);
    });

    test('should return 0 when no decks remaining', () => {
      cardCounting.runningCount = 10;
      cardCounting.cardsDealt = 432; // All cards dealt
      
      const trueCount = calculateTrueCount(cardCounting);
      
      expect(trueCount).toBe(0);
    });

    test('should handle negative True Count', () => {
      cardCounting.runningCount = -8;
      cardCounting.cardsDealt = 108;
      
      const trueCount = calculateTrueCount(cardCounting);
      
      expect(trueCount).toBeLessThan(0);
      expect(trueCount).toBeCloseTo(-1.33, 1);
    });

    test('should handle zero running count', () => {
      cardCounting.runningCount = 0;
      cardCounting.cardsDealt = 54;
      
      const trueCount = calculateTrueCount(cardCounting);
      
      expect(trueCount).toBe(0);
    });

    test('should handle high True Count', () => {
      cardCounting.runningCount = 20;
      cardCounting.cardsDealt = 54; // 1 deck dealt, 7 decks remaining
      
      const trueCount = calculateTrueCount(cardCounting);
      
      expect(trueCount).toBeCloseTo(2.86, 1);
    });
  });

  describe('getSuggestedBet', () => {
    test('should suggest minimum bet when TC <= 0', () => {
      const suggestion = getSuggestedBet(0);
      
      expect(suggestion.bet).toBe(1);
      expect(suggestion.message).toContain('minimum');
      expect(suggestion.color).toBe('text-red-300');
    });

    test('should suggest 2x bet when TC <= 2', () => {
      const suggestion = getSuggestedBet(2);
      
      expect(suggestion.bet).toBe(2);
      expect(suggestion.message).toContain('2x');
      expect(suggestion.color).toBe('text-green-300');
    });

    test('should suggest 4x bet when TC <= 3', () => {
      const suggestion = getSuggestedBet(3);
      
      expect(suggestion.bet).toBe(4);
      expect(suggestion.message).toContain('4x');
      expect(suggestion.color).toBe('text-green-400');
    });

    test('should suggest 6x bet when TC <= 4', () => {
      const suggestion = getSuggestedBet(4);
      
      expect(suggestion.bet).toBe(6);
      expect(suggestion.message).toContain('6x');
      expect(suggestion.color).toBe('text-green-500');
    });

    test('should suggest 8x bet when TC <= 5', () => {
      const suggestion = getSuggestedBet(5);
      
      expect(suggestion.bet).toBe(8);
      expect(suggestion.message).toContain('8x');
      expect(suggestion.color).toBe('text-green-600');
    });

    test('should suggest 10x bet when TC > 5', () => {
      const suggestion = getSuggestedBet(6);
      
      expect(suggestion.bet).toBe(10);
      expect(suggestion.message).toContain('10x');
      expect(suggestion.color).toBe('text-green-700');
    });

    test('should handle negative True Count', () => {
      const suggestion = getSuggestedBet(-1);
      
      expect(suggestion.bet).toBe(1);
      expect(suggestion.message).toContain('Negative');
    });
  });

  describe('resetCardCount', () => {
    test('should reset running count and cards dealt', () => {
      cardCounting.runningCount = 15;
      cardCounting.cardsDealt = 100;
      
      resetCardCount(cardCounting);
      
      expect(cardCounting.runningCount).toBe(0);
      expect(cardCounting.cardsDealt).toBe(0);
    });

    test('should preserve other card counting properties', () => {
      const initialDecks = cardCounting.initialDecks;
      const totalCards = cardCounting.totalCards;
      
      resetCardCount(cardCounting);
      
      expect(cardCounting.initialDecks).toBe(initialDecks);
      expect(cardCounting.totalCards).toBe(totalCards);
    });
  });
});
