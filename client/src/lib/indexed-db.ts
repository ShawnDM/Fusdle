/**
 * IndexedDB Storage Manager
 * 
 * This utility provides persistent storage for Fusdle using IndexedDB,
 * which is more resilient to app deployments compared to localStorage.
 */

const DB_NAME = 'fusdleDB';
const DB_VERSION = 1;
const STORE_NAME = 'gameData';

interface FusdleGameData {
  id: string;  // Added id field to match database schema
  streak: number;
  flawlessStreak: number;
  hardModeUnlocked: boolean;
  completedPuzzles: Record<string, any>;
  normalTutorialShown: boolean;
  hardTutorialShown: boolean;
  lastPlayedDate: string;
  difficultyMode: 'normal' | 'hard';
  partialMatches: Record<string, number[]>;
}

/**
 * Initialize the IndexedDB database
 * @returns A promise that resolves when the database is ready
 */
export function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Failed to open database');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for game data if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create a single record with ID 'gameState' to store all game data
        store.add({ 
          id: 'gameState',
          streak: 0,
          flawlessStreak: 0,
          hardModeUnlocked: false,
          completedPuzzles: {},
          normalTutorialShown: false,
          hardTutorialShown: false,
          lastPlayedDate: '',
          difficultyMode: 'normal',
          partialMatches: {}
        });
      }
    };
  });
}

/**
 * Migrate data from localStorage to IndexedDB
 * This should be called once during app initialization
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const db = await initDatabase();
    
    // Collect data from localStorage
    const gameData: Partial<FusdleGameData> = {
      streak: parseInt(localStorage.getItem('fusdle_streak') || '0', 10),
      flawlessStreak: parseInt(localStorage.getItem('fusdle_flawless_streak') || '0', 10),
      hardModeUnlocked: localStorage.getItem('hardModeUnlocked') === 'true',
      normalTutorialShown: localStorage.getItem('fusdle_normal_tutorial_shown') === 'true',
      hardTutorialShown: localStorage.getItem('fusdle_hard_tutorial_shown') === 'true',
      lastPlayedDate: localStorage.getItem('fusdle_last_played_date') || '',
      difficultyMode: (localStorage.getItem('fusdle_difficulty_mode') as 'normal' | 'hard') || 'normal'
    };
    
    // Parse completed puzzles
    try {
      const completedPuzzlesStr = localStorage.getItem('completedPuzzles');
      if (completedPuzzlesStr) {
        gameData.completedPuzzles = JSON.parse(completedPuzzlesStr);
      } else {
        gameData.completedPuzzles = {};
      }
    } catch (e) {
      console.error('Error parsing completedPuzzles:', e);
      gameData.completedPuzzles = {};
    }
    
    // Parse partial matches (collect all matches from various keys)
    const partialMatches: Record<string, number[]> = {};
    
    // Look for all keys that might contain partial matches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('fusdle_partial_') || key.includes('_partial_'))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            partialMatches[key] = JSON.parse(value);
          }
        } catch (e) {
          console.error(`Error parsing ${key}:`, e);
        }
      }
    }
    
    gameData.partialMatches = partialMatches;
    
    // Store in IndexedDB
    await updateGameData(gameData);
    
    console.log('Successfully migrated data from localStorage to IndexedDB');
  } catch (error) {
    console.error('Migration failed:', error);
    // If migration fails, we'll continue using localStorage as fallback
  }
}

/**
 * Update game data in IndexedDB
 * @param data Partial game data to update
 */
export function updateGameData(data: Partial<FusdleGameData>): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Get current state first
      const getRequest = store.get('gameState');
      
      getRequest.onsuccess = () => {
        const currentState = getRequest.result || { id: 'gameState' };
        
        // Merge with new data
        const updatedState = { ...currentState, ...data };
        
        // Save updated state
        const putRequest = store.put(updatedState);
        
        putRequest.onsuccess = () => {
          resolve();
        };
        
        putRequest.onerror = (event) => {
          console.error('Error updating game data:', event);
          reject('Failed to update game data');
        };
      };
      
      getRequest.onerror = (event) => {
        console.error('Error getting current game state:', event);
        reject('Failed to get current game state');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error('Error in updateGameData:', error);
      reject(error);
    }
  });
}

/**
 * Get game data from IndexedDB
 * @returns Promise that resolves with the game data
 */
export function getGameData(): Promise<FusdleGameData> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDatabase();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get('gameState');
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Return default data if no record exists
          resolve({
            id: 'gameState',
            streak: 0,
            flawlessStreak: 0,
            hardModeUnlocked: false,
            completedPuzzles: {},
            normalTutorialShown: false,
            hardTutorialShown: false,
            lastPlayedDate: '',
            difficultyMode: 'normal',
            partialMatches: {}
          });
        }
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving game data:', event);
        reject('Failed to get game data');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error('Error in getGameData:', error);
      reject(error);
    }
  });
}

/**
 * Check if data is stored in IndexedDB
 * @returns Promise that resolves with true if data exists
 */
export function checkDataExists(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDatabase();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get('gameState');
      
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      
      request.onerror = () => {
        resolve(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error('Error checking data exists:', error);
      resolve(false);
    }
  });
}

/**
 * Export all game data as a JSON string for backup
 * @returns Promise that resolves with a JSON string
 */
export function exportGameData(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const gameData = await getGameData();
      resolve(JSON.stringify(gameData));
    } catch (error) {
      console.error('Error exporting game data:', error);
      reject('Failed to export data');
    }
  });
}

/**
 * Import game data from a JSON string
 * @param jsonData JSON string with game data
 * @returns Promise that resolves when data is imported
 */
export function importGameData(jsonData: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const gameData = JSON.parse(jsonData) as FusdleGameData;
      
      // Ensure the required id is present
      if (!gameData.id) {
        gameData.id = 'gameState';
      }
      
      await updateGameData(gameData);
      resolve();
    } catch (error) {
      console.error('Error importing game data:', error);
      reject('Failed to import data');
    }
  });
}