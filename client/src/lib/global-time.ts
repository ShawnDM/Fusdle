/**
 * Global Time Utility
 * Handles fetching the current time from a reliable external API
 * to prevent users from manipulating their device clock to access puzzles.
 */

// Cache the time difference between server and client to minimize API calls
let serverTimeDiffMs: number | null = null;
let lastSyncTime: number = 0;

// How often to refresh the time sync (every 1 hour)
const SYNC_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Fetch the current time from a public time API
 * We use worldtimeapi.org as it's reliable and doesn't require API keys
 */
export async function syncWithGlobalClock(): Promise<void> {
  try {
    // Use worldtimeapi.org to get the current time in EST timezone
    const response = await fetch('https://worldtimeapi.org/api/timezone/America/New_York');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch global time: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the server time
    const serverTime = new Date(data.datetime);
    const localTime = new Date();
    
    // Calculate and store the time difference
    serverTimeDiffMs = serverTime.getTime() - localTime.getTime();
    lastSyncTime = localTime.getTime();
    
    console.log(`Synced with global clock. Server time: ${serverTime.toISOString()}`);
    console.log(`Time difference: ${serverTimeDiffMs}ms`);
    
    return;
  } catch (error) {
    console.error('Error syncing with global clock:', error);
    // On error, we'll fall back to local time
    serverTimeDiffMs = null;
    throw error;
  }
}

/**
 * Get the current date in EST timezone based on global clock
 * Falls back to local time if global time sync fails
 */
export async function getGlobalDate(): Promise<Date> {
  // Check if we need to sync with global clock
  const now = Date.now();
  if (serverTimeDiffMs === null || now - lastSyncTime > SYNC_INTERVAL_MS) {
    try {
      await syncWithGlobalClock();
    } catch (error) {
      console.warn('Using local time due to global clock sync failure');
    }
  }
  
  // Get the current date with server time adjustment if available
  const currentTime = new Date();
  if (serverTimeDiffMs !== null) {
    // Apply the server time difference
    currentTime.setTime(currentTime.getTime() + serverTimeDiffMs);
  }
  
  return currentTime;
}

/**
 * Get the current date string in YYYY-MM-DD format based on global time
 * If the time is before 4 AM EST, return yesterday's date
 */
export async function getGlobalDateString(): Promise<string> {
  const date = await getGlobalDate();
  
  // Check if it's before 4 AM EST
  // We need to use the hour in EST timezone
  const hours = date.getHours();
  const estOptions = { timeZone: 'America/New_York' };
  const estHours = new Date(date).toLocaleString('en-US', { ...estOptions, hour: 'numeric', hour12: false }).split(':')[0];
  
  // If it's before 4 AM EST, use yesterday's puzzle
  if (parseInt(estHours) < 4) {
    date.setDate(date.getDate() - 1);
  }
  
  // Return the date in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

/**
 * Determine if a new puzzle should be shown based on the last puzzle date
 * Returns true if we've crossed the 4 AM EST threshold since the last puzzle
 */
export async function shouldShowNewPuzzle(lastPuzzleDate: string): Promise<boolean> {
  const currentDateStr = await getGlobalDateString();
  return currentDateStr !== lastPuzzleDate;
}

/**
 * Expected behavior at midnight EST:
 * - The puzzle does not automatically change at midnight
 * - The puzzle changes at 4 AM EST (when a new day starts for the game)
 * - If the user is active during the transition, they'll get the new puzzle on their next page refresh or game action
 * - Completed puzzles remain completed until 4 AM EST
 */