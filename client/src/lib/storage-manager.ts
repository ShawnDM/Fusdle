/**
 * StorageManager
 * 
 * A utility to handle localStorage with versioning and structured data
 * This prevents data loss during deployments by using consistent schema
 */

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
 * Backup all important localStorage data
 * Returns the data as a JSON string that can be stored elsewhere
 */
export function backupStorageData(): string {
  const backup: Record<string, string> = {};
  
  // Add storage version to the backup
  backup[VERSION_KEY] = localStorage.getItem(VERSION_KEY) || STORAGE_VERSION.toString();
  
  // Add all persistent keys to the backup
  PERSISTENT_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      backup[key] = value;
    }
  });
  
  return JSON.stringify(backup);
}

/**
 * Restore localStorage data from a backup
 * @param backupData JSON string of the backup data
 * @returns true if restore was successful
 */
export function restoreStorageData(backupData: string): boolean {
  try {
    const backup = JSON.parse(backupData) as Record<string, string>;
    
    // Restore all keys from the backup
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    return true;
  } catch (error) {
    console.error('Failed to restore storage data:', error);
    return false;
  }
}

/**
 * Store data in localStorage with a specific key
 * For structured data, this handles the JSON stringification
 * @param key Storage key
 * @param value Value to store (can be complex object)
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    const serializedValue = typeof value === 'string' ? 
      value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
  }
}

/**
 * Get data from localStorage by key
 * For structured data, this handles the JSON parsing
 * @param key Storage key
 * @param defaultValue Default value to return if key not found
 * @returns The stored value or defaultValue if not found
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    
    // Handle different types
    if (typeof defaultValue === 'string') return value as unknown as T;
    if (typeof defaultValue === 'number') return Number(value) as unknown as T;
    if (typeof defaultValue === 'boolean') return (value === 'true') as unknown as T;
    
    // Try to parse as JSON for objects/arrays
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return defaultValue;
  }
}