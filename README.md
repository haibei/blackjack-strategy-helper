# Blackjack Strategy Helper

A web application to help you make optimal blackjack decisions, track cards, and manage your bets.

## Features

- 🎯 **Basic Strategy Recommendations**: Get optimal play recommendations based on your hand and the dealer's up card
- 🃏 **Card Tracking**: Track dealer and player cards with visual card display
- 💰 **Bet Management**: Set and adjust your bets with quick preset buttons
- 📊 **Statistics Tracking**: Track wins, losses, win rate, and total profit
- 💾 **Auto-Save**: Your game state is automatically saved to localStorage
- 🎨 **Modern UI**: Beautiful, responsive design with glassmorphism effects

## How to Use

1. **Set Your Bet**: Use the bet management controls to set your current bet and bankroll
2. **Add Dealer's Card**: Click on the card buttons to add the dealer's up card
3. **Add Your Cards**: Click on card buttons to add your cards
4. **Get Recommendation**: The strategy panel will show you the optimal play (Hit, Stand, Double, Split)
5. **Record Results**: After each hand, click "Record Win" or "Record Loss" to track your performance

## Strategy Guide

The app uses basic blackjack strategy, which includes:

- **Hard Hands**: Hands without an Ace or with an Ace counted as 1
- **Soft Hands**: Hands with an Ace counted as 11
- **Pair Splitting**: Recommendations for when to split pairs
- **Doubling Down**: When to double your bet

## Quick Actions

- **New Hand**: Clear cards for a new hand (keeps bet and stats)
- **Clear All**: Reset everything including bet
- **Record Win/Loss**: Track your game results

## Technical Details

- Pure HTML, CSS, and JavaScript (no build step required)
- Uses Tailwind CSS via CDN for styling
- LocalStorage for persistence
- IndexedDB for statistics history
- Responsive design that works on mobile and desktop

## Testing

The project includes comprehensive unit tests using Jest:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Test files are located in the `tests/` directory:
- `strategy.test.js` - Tests for strategy recommendations and card counting adjustments
- `card-counting.test.js` - Tests for card counting logic and True Count calculations
- `statistics.test.js` - Tests for statistics and profit calculations

## Open the App

Simply open `index.html` in your web browser, or serve it with a local web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

Enjoy playing blackjack with optimal strategy! 🎰

