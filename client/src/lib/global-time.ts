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
    const response = await fetch('https://worldtimeapi.org/api/timezone/America/New_York', {
      // Add cache-busting to prevent getting cached responses
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
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
    console.log(`Server time in EST: ${new Date(serverTime).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
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
 * Uses the current date in EST timezone
 */
export async function getGlobalDateString(): Promise<string> {
  const date = await getGlobalDate();
  
  // We don't need to check for any hour threshold now that we're using midnight
  // Just get the current date in EST timezone
  const estOptions = { timeZone: 'America/New_York' };
  const estDate = new Date(date.toLocaleString('en-US', estOptions));
  
  // Return the date in YYYY-MM-DD format
  return estDate.toISOString().split('T')[0];
}

/**
 * Determine if a new puzzle should be shown based on the last puzzle date
 * Returns true if we've crossed the midnight EST threshold since the last puzzle
 */
export async function shouldShowNewPuzzle(lastPuzzleDate: string): Promise<boolean> {
  // Force a fresh sync with the time server to get the most accurate time
  try {
    await syncWithGlobalClock();
  } catch (error) {
    console.warn('Failed to sync with global clock for refresh check, using best available time');
  }
  
  const currentDateStr = await getGlobalDateString();
  console.log(`Checking for puzzle refresh - Last date: ${lastPuzzleDate}, Current date: ${currentDateStr}`);
  return currentDateStr !== lastPuzzleDate;
}

/**
 * Expected behavior at midnight EST:
 * - The puzzle changes at midnight EST (when a new day starts)
 * - If the user is active during the transition, they'll get the new puzzle on their next page refresh or game action
 * - Completed puzzles are reset at midnight EST
 * - The game checks once per minute if we've crossed midnight since the last puzzle was loaded
 */