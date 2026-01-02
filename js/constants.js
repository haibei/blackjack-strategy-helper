// Constants for Blackjack Strategy Helper

export const cardCountValues = {
    '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    '7': 0, '8': 0, '9': 0,
    '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
};

export const cardValues = {
    'A': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

export const cardSuits = {
    'A': '♠', '2': '♠', '3': '♠', '4': '♠', '5': '♠', '6': '♠',
    '7': '♠', '8': '♠', '9': '♠', '10': '♠', 'J': '♠', 'Q': '♠', 'K': '♠'
};

export const DB_NAME = 'BlackjackStatsDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'statistics';

