// Jest setup file for DOM environment
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock indexedDB
global.indexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          index: jest.fn(() => ({
            openCursor: jest.fn(() => ({
              onsuccess: null,
              onerror: null,
            })),
          })),
        })),
        complete: Promise.resolve(),
      })),
    },
  })),
};

// Create a minimal DOM structure
document.body.innerHTML = `
  <div id="dealerCards"></div>
  <div id="playerCards"></div>
  <div id="dealerValue">0</div>
  <div id="playerValue">0</div>
  <div id="strategyDisplay"></div>
  <div id="strategyDetails"></div>
  <div id="currentBet" value="1">1</div>
  <div id="bankroll" value="1000">1000</div>
  <div id="runningCount">0</div>
  <div id="cardsDealt">0</div>
  <div id="decksRemaining">8.0</div>
  <div id="trueCount">0.0</div>
  <div id="suggestedBet">$1</div>
  <div id="suggestedBetMessage"></div>
  <div id="gamesPlayed">0</div>
  <div id="wins">0</div>
  <div id="losses">0</div>
  <div id="pushes">0</div>
  <div id="winRate">0%</div>
  <div id="totalProfit">$0</div>
  <input type="checkbox" id="useSuggestedBet">
`;

