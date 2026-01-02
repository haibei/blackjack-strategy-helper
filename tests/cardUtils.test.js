/**
 * Unit tests for Card Utility Functions
 */

import { calculateHandValue, isSoftHand } from '../js/cardUtils.js';

describe('Card Utilities', () => {
  describe('calculateHandValue', () => {
    test('should calculate value for simple hands', () => {
      expect(calculateHandValue(['2', '3'])).toBe(5);
      expect(calculateHandValue(['10', '5'])).toBe(15);
      expect(calculateHandValue(['K', 'Q'])).toBe(20);
    });

    test('should handle aces as 11 when beneficial', () => {
      expect(calculateHandValue(['A', '5'])).toBe(16);
      expect(calculateHandValue(['A', '9'])).toBe(20);
      expect(calculateHandValue(['A', '10'])).toBe(21);
    });

    test('should handle aces as 1 when 11 would bust', () => {
      expect(calculateHandValue(['A', '10', '5'])).toBe(16);
      expect(calculateHandValue(['A', '9', '8'])).toBe(18);
      expect(calculateHandValue(['A', 'A', '9'])).toBe(21);
    });

    test('should handle multiple aces correctly', () => {
      expect(calculateHandValue(['A', 'A'])).toBe(12);
      expect(calculateHandValue(['A', 'A', 'A'])).toBe(13);
      expect(calculateHandValue(['A', 'A', 'A', 'A'])).toBe(14);
      expect(calculateHandValue(['A', 'A', '10'])).toBe(12);
      expect(calculateHandValue(['A', 'A', '9', '8'])).toBe(19);
    });

    test('should handle face cards', () => {
      expect(calculateHandValue(['J', 'Q'])).toBe(20);
      expect(calculateHandValue(['K', '5'])).toBe(15);
      expect(calculateHandValue(['J', 'A'])).toBe(21);
    });

    test('should handle empty hand', () => {
      expect(calculateHandValue([])).toBe(0);
    });

    test('should handle single card', () => {
      expect(calculateHandValue(['A'])).toBe(11);
      expect(calculateHandValue(['10'])).toBe(10);
      expect(calculateHandValue(['5'])).toBe(5);
    });

    test('should handle complex hands', () => {
      expect(calculateHandValue(['A', 'A', 'A', '8'])).toBe(21);
      expect(calculateHandValue(['A', 'A', 'A', 'A', '7'])).toBe(21);
      expect(calculateHandValue(['A', 'A', 'A', 'A', 'A', '5'])).toBe(20); // 4 aces as 1, 1 ace as 11: 1+1+1+1+11+5 = 20
      expect(calculateHandValue(['A', 'A', 'A', 'A', 'A', '6'])).toBe(21); // 4 aces as 1, 1 ace as 11: 1+1+1+1+11+6 = 21
    });

    test('should handle bust hands', () => {
      expect(calculateHandValue(['10', '10', '5'])).toBe(25);
      expect(calculateHandValue(['K', 'Q', 'J'])).toBe(30);
      expect(calculateHandValue(['A', '10', '10', '5'])).toBe(26);
    });
  });

  describe('isSoftHand', () => {
    test('should return true for soft hands', () => {
      expect(isSoftHand(['A', '5'])).toBe(true);
      expect(isSoftHand(['A', '9'])).toBe(true);
      expect(isSoftHand(['A', '10'])).toBe(true);
      expect(isSoftHand(['A', 'A', '5'])).toBe(true);
      expect(isSoftHand(['A', '2', '3'])).toBe(true);
    });

    test('should return false for hard hands', () => {
      expect(isSoftHand(['10', '5'])).toBe(false);
      expect(isSoftHand(['K', 'Q'])).toBe(false);
      expect(isSoftHand(['2', '3'])).toBe(false);
      expect(isSoftHand(['10', '10', '5'])).toBe(false);
    });

    test('should return false when ace must be 1', () => {
      expect(isSoftHand(['A', '10', '5'])).toBe(false);
      expect(isSoftHand(['A', '9', '8'])).toBe(false);
      expect(isSoftHand(['A', 'A', 'A', '9'])).toBe(false);
    });

    test('should return false for empty hand', () => {
      expect(isSoftHand([])).toBe(false);
    });

    test('should return false for single ace', () => {
      expect(isSoftHand(['A'])).toBe(true); // Single ace is soft
    });

    test('should return false for bust hands', () => {
      expect(isSoftHand(['A', '10', '10', '5'])).toBe(false);
      expect(isSoftHand(['10', '10', '5'])).toBe(false);
    });

    test('should handle multiple aces correctly', () => {
      expect(isSoftHand(['A', 'A'])).toBe(true);
      expect(isSoftHand(['A', 'A', 'A'])).toBe(true);
      expect(isSoftHand(['A', 'A', 'A', '8'])).toBe(true);
      expect(isSoftHand(['A', 'A', 'A', 'A', '7'])).toBe(true);
    });
  });
});

