/**
 * StorageManager
 * 
 * A utility to handle both localStorage and IndexedDB with version control
 * This provides a consistent API for accessing user data that survives deployments
 */

import { getGameData, updateGameData, checkDataExists } from './indexed-db';

// Current version of the storage format
const STORAGE_VERSION = 1;
const VERSION_KEY = 'fusdle_storage_version';

// Keys that we want to preserve across deployments
const PERSISTENT_KEYS = [
  // Game progress
  'completedPuzzles',
  'fusdle_streak',
  'fusdle_flawless_streak',
  'hardModeUnlocked',
  // Tutorial flags
  'fusdle_normal_tutorial_shown',
  'fusdle_hard_tutorial_shown',
  'fusdle_last_played_date',
  // User preferences
  'fusdle_difficulty_mode'
];

/**
 * Initialize storage versioning
 * Should be called when the application loads
 */
export function initStorage(): void {
  const currentVersion = localStorage.getItem(VERSION_KEY);
  
  // First time initialization
  if (!currentVersion) {
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION.toString());
    console.log('Storage initialized with version', STORAGE_VERSION);
    return;
  }
  
  // Handle version migrations if needed
  const versionNum = parseInt(currentVersion, 10);
  if (versionNum < STORAGE_VERSION) {
    // Migration logic would go here
    // For example: migrateFromVersion(versionNum, STORAGE_VERSION);
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION.toString());
    console.log(`Storage migrated from version ${versionNum} to ${STORAGE_VERSION}`);
  }
}

/**
 * Get a value from storage with proper fallback
 * Tries IndexedDB first, then falls back to localStorage
 * 
 * @param key The key to retrieve
 * @param defaultValue Default value if not found
 * @returns The stored value or default value
 */
export async function getStorageValue<T>(key: string, defaultValue: T): Promise<T> {
  try {
    // Check if IndexedDB is available and has data
    const hasIndexedDbData = await checkDataExists();
    
    if (hasIndexedDbData) {
      // Get data from IndexedDB
      const gameData = await getGameData();
      
      // Return the specific key value if it exists
      switch (key) {
        case 'streak':
        case 'fusdle_streak':
          return gameData.streak as unknown as T;
        case 'flawlessStreak':
        case 'fusdle_flawless_streak':
          return gameData.flawlessStreak as unknown as T;
        case 'hardModeUnlocked':
          return gameData.hardModeUnlocked as unknown as T;
        case 'completedPuzzles':
          return gameData.completedPuzzles as unknown as T;
        case 'fusdle_normal_tutorial_shown':
          return gameData.normalTutorialShown as unknown as T;
        case 'fusdle_hard_tutorial_shown':
          return gameData.hardTutorialShown as unknown as T;
        case 'fusdle_last_played_date':
          return gameData.lastPlayedDate as unknown as T;
        case 'fusdle_difficulty_mode':
          return gameData.difficultyMode as unknown as T;
        default:
          // For any other keys, try localStorage as fallback
          break;
      }
    }
    
    // Fallback to localStorage
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    
    // Parse based on the type of the default value
    if (typeof defaultValue === 'number') return Number(value) as unknown as T;
    if (typeof defaultValue === 'boolean') return (value === 'true') as unknown as T;
    if (typeof defaultValue === 'string') return value as unknown as T;
    
    // Try to parse as JSON for objects/arrays
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a value in storage with proper persistence
 * Stores in both IndexedDB and localStorage for maximum compatibility
 * 
 * @param key The key to store
 * @param value The value to store
 */
export async function setStorageValue<T>(key: string, value: T): Promise<void> {
  try {
    // Store in localStorage for backward compatibility
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
    
    // Also store in IndexedDB for persistence across deployments
    // Map our keys to the IndexedDB structure
    switch (key) {
      case 'streak':
      case 'fusdle_streak':
        await updateGameData({ streak: value as unknown as number });
        break;
      case 'flawlessStreak':
      case 'fusdle_flawless_streak':
        await updateGameData({ flawlessStreak: value as unknown as number });
        break;
      case 'hardModeUnlocked':
        await updateGameData({ hardModeUnlocked: value as unknown as boolean });
        break;
      case 'completedPuzzles':
        await updateGameData({ completedPuzzles: value as unknown as Record<string, any> });
        break;
      case 'fusdle_normal_tutorial_shown':
        await updateGameData({ normalTutorialShown: value as unknown as boolean });
        break;
      case 'fusdle_hard_tutorial_shown':
        await updateGameData({ hardTutorialShown: value as unknown as boolean });
        break;
      case 'fusdle_last_played_date':
        await updateGameData({ lastPlayedDate: value as unknown as string });
        break;
      case 'fusdle_difficulty_mode':
        await updateGameData({ difficultyMode: value as unknown as 'normal' | 'hard' });
        break;
      default:
        // Other values are only stored in localStorage
        break;
    }
  } catch (error) {
    console.error(`Error setting value for key ${key}:`, error);
  }
}

/**
 * Clear a value from storage
 * 
 * @param key The key to clear
 */
export async function clearStorageValue(key: string): Promise<void> {
  try {
    // Remove from localStorage
    localStorage.removeItem(key);
    
    // Also clear from IndexedDB based on key mapping
    switch (key) {
      case 'streak':
      case 'fusdle_streak':
        await updateGameData({ streak: 0 });
        break;
      case 'flawlessStreak':
      case 'fusdle_flawless_streak':
        await updateGameData({ flawlessStreak: 0 });
        break;
      case 'hardModeUnlocked':
        await updateGameData({ hardModeUnlocked: false });
        break;
      case 'completedPuzzles':
        await updateGameData({ completedPuzzles: {} });
        break;
      case 'fusdle_normal_tutorial_shown':
        await updateGameData({ normalTutorialShown: false });
        break;
      case 'fusdle_hard_tutorial_shown':
        await updateGameData({ hardTutorialShown: false });
        break;
      case 'fusdle_last_played_date':
        await updateGameData({ lastPlayedDate: '' });
        break;
      case 'fusdle_difficulty_mode':
        await updateGameData({ difficultyMode: 'normal' });
        break;
      default:
        // Other values are only cleared from localStorage
        break;
    }
  } catch (error) {
    console.error(`Error clearing value for key ${key}:`, error);
  }
}