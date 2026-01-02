/**
 * Unit tests for Strategy Recommendations
 */

import { getStrategyRecommendation, getActionEmoji } from '../js/strategy.js';
import { createInitialGameState } from '../js/gameState.js';

describe('Strategy Recommendations', () => {
  let cardCounting;

  beforeEach(() => {
    const gameState = createInitialGameState();
    cardCounting = gameState.cardCounting;
  });

  describe('Basic Strategy', () => {
    test('should return wait message when no cards', () => {
      const result = getStrategyRecommendation([], null, cardCounting);
      
      expect(result.action).toBe('wait');
      expect(result.message).toContain('Add cards');
    });

    test('should detect blackjack', () => {
      const result = getStrategyRecommendation(['A', 'K'], '5', cardCounting);
      
      expect(result.action).toBe('blackjack');
      expect(result.message).toContain('BLACKJACK');
    });

    test('should detect bust', () => {
      const result = getStrategyRecommendation(['10', '10', '5'], '5', cardCounting);
      
      expect(result.action).toBe('bust');
      expect(result.message).toContain('BUST');
    });

    test('should recommend hit on hard 16 vs 10 (basic strategy)', () => {
      cardCounting.runningCount = 0; // Neutral count
      const result = getStrategyRecommendation(['10', '6'], '10', cardCounting);
      
      expect(result.action).toBe('hit');
    });

    test('should recommend stand on hard 17+', () => {
      const result = getStrategyRecommendation(['10', '7'], '10', cardCounting);
      
      expect(result.action).toBe('stand');
    });

    test('should recommend double on 11 vs 10', () => {
      const result = getStrategyRecommendation(['5', '6'], '10', cardCounting);
      
      expect(result.action).toBe('double');
    });
  });

  describe('Insurance Logic', () => {
    test('should recommend insurance when TC >= 3', () => {
      cardCounting.runningCount = 22;
      cardCounting.cardsDealt = 54; // TC = 22/7 ≈ 3.1
      
      const result = getStrategyRecommendation(['10', '6'], 'A', cardCounting);
      
      expect(result.action).toBe('insurance');
      expect(result.message).toContain('INSURANCE');
    });

    test('should not recommend insurance when TC < 3', () => {
      cardCounting.runningCount = 5;
      cardCounting.cardsDealt = 54; // TC ≈ 0.9
      
      const result = getStrategyRecommendation(['10', '6'], 'A', cardCounting);
      
      expect(result.action).toBe('no-insurance');
      expect(result.message).toContain('NO INSURANCE');
    });
  });

  describe('Card Counting Adjustments', () => {
    test('Hard 16 vs 10: should stand when TC >= 1', () => {
      cardCounting.runningCount = 8;
      cardCounting.cardsDealt = 54; // TC ≈ 1.5
      
      const result = getStrategyRecommendation(['10', '6'], '10', cardCounting);
      
      expect(result.action).toBe('stand');
    });

    test('Hard 16 vs 10: should hit when TC < 1', () => {
      cardCounting.runningCount = 0;
      cardCounting.cardsDealt = 54; // TC ≈ 0
      
      const result = getStrategyRecommendation(['10', '6'], '10', cardCounting);
      
      expect(result.action).toBe('hit');
    });

    test('Hard 12 vs 2: should stand when TC >= 2', () => {
      cardCounting.runningCount = 15;
      cardCounting.cardsDealt = 54; // TC = 15/7 ≈ 2.1
      
      const result = getStrategyRecommendation(['10', '2'], '2', cardCounting);
      
      expect(result.action).toBe('stand');
    });

    test('Hard 12 vs 2: should hit when TC < 2', () => {
      cardCounting.runningCount = 5;
      cardCounting.cardsDealt = 54; // TC ≈ 0.9
      
      const result = getStrategyRecommendation(['10', '2'], '2', cardCounting);
      
      expect(result.action).toBe('hit');
    });

    test('Hard 15 vs 10: should stand when TC >= 4', () => {
      cardCounting.runningCount = 28;
      cardCounting.cardsDealt = 54; // TC = 28/7 = 4.0
      
      const result = getStrategyRecommendation(['10', '5'], '10', cardCounting);
      
      expect(result.action).toBe('stand');
    });

    test('Hard 15 vs 10: should hit when TC < 4', () => {
      cardCounting.runningCount = 15;
      cardCounting.cardsDealt = 54; // TC ≈ 2.8
      
      const result = getStrategyRecommendation(['10', '5'], '10', cardCounting);
      
      expect(result.action).toBe('hit');
    });

    test('Hard 13 vs 2: should stand when TC >= -1', () => {
      cardCounting.runningCount = -3;
      cardCounting.cardsDealt = 54; // TC ≈ -0.6
      
      const result = getStrategyRecommendation(['10', '3'], '2', cardCounting);
      
      expect(result.action).toBe('stand');
    });

    test('Hard 13 vs 2: should hit when TC < -1', () => {
      cardCounting.runningCount = -10;
      cardCounting.cardsDealt = 54; // TC ≈ -1.9
      
      const result = getStrategyRecommendation(['10', '3'], '2', cardCounting);
      
      expect(result.action).toBe('hit');
    });
  });

  describe('Pair Splitting', () => {
    test('should always split Aces', () => {
      const result = getStrategyRecommendation(['A', 'A'], '5', cardCounting);
      
      expect(result.action).toBe('split');
    });

    test('should always split 8s', () => {
      const result = getStrategyRecommendation(['8', '8'], '10', cardCounting);
      
      expect(result.action).toBe('split');
    });

    test('should never split 10s', () => {
      const result = getStrategyRecommendation(['10', '10'], '5', cardCounting);
      
      expect(result.action).toBe('stand');
    });

    test('should split 9s vs 2-6, 8, 9', () => {
      const result = getStrategyRecommendation(['9', '9'], '5', cardCounting);
      
      expect(result.action).toBe('split');
    });
  });

  describe('Soft Hands', () => {
    test('should recommend double on soft 13-18 vs 5-6', () => {
      const result = getStrategyRecommendation(['A', '7'], '5', cardCounting);
      
      expect(result.action).toBe('double');
    });

    test('should recommend hit on soft 13-18 vs 2-4, 7-A', () => {
      const result = getStrategyRecommendation(['A', '7'], '10', cardCounting);
      
      expect(result.action).toBe('hit');
    });
  });

  describe('getActionEmoji', () => {
    test('should return correct emoji for each action', () => {
      expect(getActionEmoji('hit')).toBe('⬇️');
      expect(getActionEmoji('stand')).toBe('✋');
      expect(getActionEmoji('double')).toBe('💰');
      expect(getActionEmoji('split')).toBe('✂️');
      expect(getActionEmoji('surrender')).toBe('🏳️');
      expect(getActionEmoji('insurance')).toBe('🛡️');
      expect(getActionEmoji('blackjack')).toBe('🎉');
      expect(getActionEmoji('bust')).toBe('💥');
      expect(getActionEmoji('wait')).toBe('🎲');
      expect(getActionEmoji('unknown')).toBe('🎲'); // Default emoji
    });
  });
});
