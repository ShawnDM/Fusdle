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
    // Try to use worldtimeapi.org first (most reliable)
    try {
      // Create a controller for the timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://worldtimeapi.org/api/timezone/America/New_York', {
        // Add cache-busting to prevent getting cached responses
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        },
        // Add a short timeout to fail fast if the API is not responding
        signal: controller.signal
      });
      
      // Clear the timeout if the fetch completes
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Parse the server time
        const serverTime = new Date(data.datetime);
        const localTime = new Date();
        
        // Calculate and store the time difference
        serverTimeDiffMs = serverTime.getTime() - localTime.getTime();
        lastSyncTime = localTime.getTime();
        
        console.log(`Synced with worldtimeapi.org. Server time: ${serverTime.toISOString()}`);
        console.log(`Server time in EST: ${new Date(serverTime).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
        console.log(`Time difference: ${serverTimeDiffMs}ms`);
        
        return;
      }
    } catch (apiError) {
      console.warn('Primary time API failed, trying fallback method', apiError);
    }
    
    // Fallback method: Use the user's local time with EST timezone conversion
    // This is less reliable if the user manipulates their clock, but better than nothing
    const localTime = new Date();
    const estTime = new Date(localTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    
    // No time difference to store in this case since we're using local time directly
    serverTimeDiffMs = 0;
    lastSyncTime = localTime.getTime();
    
    console.log(`Using fallback time method. Local time converted to EST: ${estTime.toISOString()}`);
    
    return;
  } catch (error) {
    console.error('All time sync methods failed:', error);
    // As a last resort, we'll fall back to local time with no adjustments
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
  // Try multiple methods to determine if the date has changed
  
  // Method 1: Try global clock API (most reliable but may fail)
  try {
    // Force a fresh sync with the time server to get the most accurate time
    await syncWithGlobalClock();
    const globalDateStr = await getGlobalDateString();
    
    console.log(`Method 1 - API check: Last date: ${lastPuzzleDate}, Current date: ${globalDateStr}`);
    if (globalDateStr !== lastPuzzleDate) {
      return true;
    }
  } catch (error) {
    console.warn('Method 1 failed: Global clock sync failed, trying other methods');
  }
  
  // Method 2: Use browser's timezone API (pretty reliable but can be manipulated)
  try {
    const nowLocal = new Date();
    const nowEST = new Date(nowLocal.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const estDateString = nowEST.toISOString().split('T')[0];
    
    console.log(`Method 2 - Browser timezone: Last date: ${lastPuzzleDate}, Current date: ${estDateString}`);
    if (estDateString !== lastPuzzleDate) {
      return true;
    }
  } catch (error) {
    console.warn('Method 2 failed: Browser timezone API failed, trying final method');
  }
  
  // Method 3: Simple date storage and comparison (fallback)
  // Store the last check time in memory and see if we've crossed midnight EST
  try {
    // Only used for this method
    const lastCheckKey = '_lastPuzzleTimeCheck';
    const lastCheckTime = localStorage.getItem(lastCheckKey);
    const currentTime = new Date().getTime();
    
    // If it's been more than 12 hours since our last check, assume we might need a refresh
    if (!lastCheckTime || (currentTime - parseInt(lastCheckTime)) > 12 * 60 * 60 * 1000) {
      localStorage.setItem(lastCheckKey, currentTime.toString());
      console.log('Method 3: More than 12 hours passed, suggesting refresh');
      return true;
    }
    
    localStorage.setItem(lastCheckKey, currentTime.toString());
  } catch (error) {
    console.warn('Method 3 failed: localStorage not available');
  }
  
  // No methods detected a date change
  console.log('All methods checked - no date change detected');
  return false;
}

/**
 * Expected behavior at midnight EST:
 * - The puzzle changes at midnight EST (when a new day starts)
 * - If the user is active during the transition, they'll get the new puzzle on their next page refresh or game action
 * - Completed puzzles are reset at midnight EST
 * - The game checks once per minute if we've crossed midnight since the last puzzle was loaded
 */