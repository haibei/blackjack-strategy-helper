// Statistics and IndexedDB Management

import { DB_NAME, DB_VERSION, STORE_NAME } from './constants.js';

let db = null;

/**
 * Initialize IndexedDB
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                objectStore.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

/**
 * Save statistics record to IndexedDB
 */
export async function saveStatsRecord(stats) {
    try {
        if (!db) {
            await initDB();
        }
        
        const now = new Date();
        const record = {
            timestamp: now.getTime(),
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString(),
            datetime: now.toLocaleString(),
            gamesPlayed: stats.gamesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            pushes: stats.pushes || 0,
            totalProfit: stats.totalProfit,
            winRate: stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0
        };
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.add(record);
        
        console.log('Statistics record saved:', record);
        return record;
    } catch (error) {
        console.error('Error saving statistics record:', error);
        throw error;
    }
}

/**
 * Get all statistics records from IndexedDB
 */
export async function getAllStatsRecords() {
    try {
        if (!db) {
            await initDB();
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const records = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    records.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting statistics records:', error);
        return [];
    }
}

/**
 * Delete a statistics record
 */
export async function deleteStatsRecord(id) {
    try {
        if (!db) {
            await initDB();
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.delete(id);
        
        console.log('Statistics record deleted:', id);
        return true;
    } catch (error) {
        console.error('Error deleting statistics record:', error);
        return false;
    }
}

/**
 * Clear all statistics records
 */
export async function clearAllStatsRecords() {
    try {
        if (!db) {
            await initDB();
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.clear();
        await transaction.complete;
        
        console.log('All statistics records cleared');
        return true;
    } catch (error) {
        console.error('Error clearing records:', error);
        return false;
    }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
    try {
        const records = await getAllStatsRecords();
        const totalRecords = records.length;
        const totalProfit = records.reduce((sum, r) => sum + r.totalProfit, 0);
        const totalGames = records.reduce((sum, r) => sum + r.gamesPlayed, 0);
        const totalWins = records.reduce((sum, r) => sum + r.wins, 0);
        const totalLosses = records.reduce((sum, r) => sum + r.losses, 0);
        
        return {
            totalRecords,
            totalProfit,
            totalGames,
            totalWins,
            totalLosses,
            overallWinRate: totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0,
            oldestRecord: records.length > 0 ? records[records.length - 1].datetime : null,
            newestRecord: records.length > 0 ? records[0].datetime : null
        };
    } catch (error) {
        console.error('Error getting database stats:', error);
        return null;
    }
}

/**
 * Export statistics records as JSON
 */
export async function exportStatsRecords() {
    try {
        const records = await getAllStatsRecords();
        const dataStr = JSON.stringify(records, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blackjack-stats-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Exported', records.length, 'records');
        return records;
    } catch (error) {
        console.error('Error exporting records:', error);
        alert('Failed to export records');
        return null;
    }
}

/**
 * Import statistics records from JSON file
 */
export async function importStatsRecords(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const records = JSON.parse(e.target.result);
                if (!Array.isArray(records)) {
                    throw new Error('Invalid file format');
                }
                
                if (!db) {
                    await initDB();
                }
                
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                let imported = 0;
                for (const record of records) {
                    const { id, ...recordWithoutId } = record;
                    await store.add(recordWithoutId);
                    imported++;
                }
                
                await transaction.complete;
                console.log('Imported', imported, 'records');
                resolve(imported);
            } catch (error) {
                console.error('Error importing records:', error);
                alert('Failed to import records: ' + error.message);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

