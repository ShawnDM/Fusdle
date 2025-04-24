/**
 * IndexedDB Storage Manager
 * 
 * This utility provides persistent storage for Fusdle using IndexedDB,
 * which is more resilient to app deployments compared to localStorage.
 */

// IndexedDB configuration
const DB_NAME = 'FusdleDB';
const DB_VERSION = 1;
const STORE_NAME = 'gameData';
const DATA_KEY = 'fusdle_game_data';

// Game data structure
export interface FusdleGameData {
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
    console.log('Initializing IndexedDB database...');
    
    // Open or create the database
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    // Handle database upgrade (first time or version change)
    request.onupgradeneeded = (event) => {
      console.log('Database upgrade needed - creating object store');
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create the object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log('Object store created:', STORE_NAME);
      }
    };
    
    // Handle success
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };
    
    // Handle errors
    request.onerror = (event) => {
      console.error('IndexedDB initialization error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Migrate data from localStorage to IndexedDB
 * This should be called once during app initialization
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    console.log('Checking for data to migrate from localStorage...');
    
    // Check if we have data in localStorage
    const legacyData = localStorage.getItem('fusdle_game_data');
    if (!legacyData) {
      console.log('No localStorage data found to migrate');
      return;
    }
    
    // Check if we already have data in IndexedDB
    const hasData = await checkDataExists();
    if (hasData) {
      console.log('IndexedDB already contains data, skipping migration');
      return;
    }
    
    // Parse localStorage data
    const gameData = JSON.parse(legacyData);
    console.log('Found localStorage data to migrate:', gameData);
    
    // Adapt the data format if necessary
    const adaptedData: FusdleGameData = {
      ...gameData,
      id: DATA_KEY, // Add the required ID field
    };
    
    // Store data in IndexedDB
    await updateGameData(adaptedData);
    console.log('Data successfully migrated from localStorage to IndexedDB');
    
    // Optional: clear localStorage data after migration
    // localStorage.removeItem('fusdle_game_data');
    
  } catch (error) {
    console.error('Error migrating data from localStorage:', error);
    throw error;
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
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // First try to get existing data
      const getRequest = store.get(DATA_KEY);
      
      getRequest.onsuccess = () => {
        let updatedData: FusdleGameData;
        
        if (getRequest.result) {
          // Update existing data
          updatedData = {
            ...getRequest.result,
            ...data,
            id: DATA_KEY  // Ensure ID is preserved
          };
        } else {
          // Create new data
          const defaultData: FusdleGameData = {
            id: DATA_KEY,
            streak: 0,
            flawlessStreak: 0,
            hardModeUnlocked: false,
            completedPuzzles: {},
            normalTutorialShown: false,
            hardTutorialShown: false,
            lastPlayedDate: '',
            difficultyMode: 'normal',
            partialMatches: {},
          };
          
          updatedData = {
            ...defaultData,
            ...data,
          };
        }
        
        // Put the updated data
        const putRequest = store.put(updatedData);
        
        putRequest.onsuccess = () => {
          resolve();
        };
        
        putRequest.onerror = (event) => {
          console.error('Error updating game data:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      };
      
      getRequest.onerror = (event) => {
        console.error('Error getting existing game data:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      // Close the database when the transaction is complete
      tx.oncomplete = () => {
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
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      
      const request = store.get(DATA_KEY);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Return default data if nothing is found
          const defaultData: FusdleGameData = {
            id: DATA_KEY,
            streak: 0,
            flawlessStreak: 0,
            hardModeUnlocked: false,
            completedPuzzles: {},
            normalTutorialShown: false,
            hardTutorialShown: false,
            lastPlayedDate: '',
            difficultyMode: 'normal',
            partialMatches: {},
          };
          resolve(defaultData);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error getting game data:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      // Close the database when the transaction is complete
      tx.oncomplete = () => {
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
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      
      const request = store.get(DATA_KEY);
      
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error checking data exists:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      // Close the database when the transaction is complete
      tx.oncomplete = () => {
        db.close();
      };
      
    } catch (error) {
      console.error('Error in checkDataExists:', error);
      reject(error);
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
      const data = await getGameData();
      resolve(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error exporting game data:', error);
      reject(error);
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
      // Parse the JSON string
      const parsedData = JSON.parse(jsonData);
      
      // Validate and adapt the data
      const gameData: FusdleGameData = {
        ...parsedData,
        id: DATA_KEY // Ensure the ID is correct
      };
      
      // Store in IndexedDB
      await updateGameData(gameData);
      resolve();
    } catch (error) {
      console.error('Error importing game data:', error);
      reject(error);
    }
  });
}

// Add event listener to save data when page is closed
window.addEventListener('beforeunload', () => {
  console.log('Page unloading - data is preserved in IndexedDB');
});