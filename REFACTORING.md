# Code Refactoring Guide

## Overview

The codebase has been refactored into modular components for better:
- **Testability**: Pure functions can be easily unit tested
- **Readability**: Clear separation of concerns
- **Maintainability**: Easier to find and modify specific functionality

## New File Structure

```
js/
├── constants.js          # Card values, card count values, DB constants
├── gameState.js          # Game state management functions
├── cardUtils.js          # Card utility functions (calculateHandValue, isSoftHand)
├── cardCounting.js       # Card counting logic (updateCardCount, calculateTrueCount, etc.)
├── strategy.js           # Strategy recommendations with card counting adjustments
├── gameLogic.js          # Game actions (addCard, removeCard, split, recordWin, etc.)
├── betManagement.js      # Bet management functions
└── statistics.js         # Statistics and IndexedDB operations

app.js                    # Main orchestrator (UI updates, event handlers)
```

## Module Responsibilities

### `constants.js`
- Card values mapping
- Card counting values (Hi-Lo system)
- Database constants

### `gameState.js`
- Create initial game state
- Reset game state
- Reset statistics

### `cardUtils.js`
- `calculateHandValue()` - Calculate hand value
- `isSoftHand()` - Check if hand is soft

### `cardCounting.js`
- `updateCardCount()` - Update running count
- `calculateTrueCount()` - Calculate True Count
- `getSuggestedBet()` - Get suggested bet based on TC
- `resetCardCount()` - Reset card counting

### `strategy.js`
- `getStrategyRecommendation()` - Main strategy function with card counting adjustments
- `getActionEmoji()` - Get emoji for action
- Helper functions for pair splitting, soft hands, hard hands

### `gameLogic.js`
- `addCard()` - Add card to hand
- `removeCard()` - Remove card from hand
- `clearHand()` - Clear a hand
- `splitHand()` - Split a hand
- `doubleDown()` - Double down
- `recordWin()` - Record win
- `recordLoss()` - Record loss
- `recordPush()` - Record push
- `recordSplitResult()` - Record split hand result

### `betManagement.js`
- `getEffectiveBet()` - Get effective bet (current or suggested)
- `adjustBet()` - Adjust bet amount
- `setBet()` - Set bet amount

### `statistics.js`
- `initDB()` - Initialize IndexedDB
- `saveStatsRecord()` - Save stats to database
- `getAllStatsRecords()` - Get all saved records
- `deleteStatsRecord()` - Delete a record
- `clearAllStatsRecords()` - Clear all records
- `exportStatsRecords()` - Export as JSON
- `importStatsRecords()` - Import from JSON
- `getDatabaseStats()` - Get database statistics

### `app.js` (Main File)
- UI update functions
- Event handlers
- DOM manipulation
- Orchestrates all modules
- Maintains backward compatibility with HTML

## Migration Steps

### Option 1: Use Refactored Version (Recommended)

1. **Update index.html**:
   ```html
   <script type="module" src="app-refactored.js"></script>
   ```

2. **Test thoroughly** - All functionality should work the same

3. **Rename files**:
   ```bash
   mv app.js app-old.js
   mv app-refactored.js app.js
   ```

### Option 2: Gradual Migration

1. Keep current `app.js` working
2. Gradually move functions to modules
3. Update imports as you go

## Benefits of Refactoring

1. **Testability**: Pure functions can be tested independently
   ```javascript
   import { calculateHandValue } from './js/cardUtils.js';
   // Easy to test without DOM
   ```

2. **Reusability**: Functions can be reused across different contexts

3. **Maintainability**: 
   - Strategy logic is in one place (`strategy.js`)
   - Card counting logic is isolated (`cardCounting.js`)
   - Easy to find and modify specific features

4. **Readability**: 
   - Smaller, focused files
   - Clear module boundaries
   - Better code organization

## Testing the Refactored Code

All modules export their functions, making them easy to test:

```javascript
// Example test
import { calculateHandValue } from './js/cardUtils.js';

test('calculateHandValue', () => {
    expect(calculateHandValue(['10', '5'])).toBe(15);
});
```

## Backward Compatibility

The refactored `app.js` maintains all the same global function names that HTML uses:
- `addCard()`, `removeCard()`, `clearHand()`
- `splitHand()`, `doubleDown()`, `recordWin()`, etc.

All existing HTML onclick handlers will continue to work.

