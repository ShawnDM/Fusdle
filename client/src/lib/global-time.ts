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
 * We use worldtimeapi.org as primary and timeapi.io as backup
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
      console.warn('Primary time API failed, trying alternate time API', apiError);
    }
    
    // Try timeapi.io as second option
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=America/New_York', {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Parse date from this format: 2025-04-24T00:01:02
        const dateTimeStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}T${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}:${String(data.seconds).padStart(2, '0')}`;
        const serverTime = new Date(dateTimeStr);
        const localTime = new Date();
        
        // Calculate and store the time difference
        serverTimeDiffMs = serverTime.getTime() - localTime.getTime();
        lastSyncTime = localTime.getTime();
        
        console.log(`Synced with timeapi.io. Server time: ${serverTime.toISOString()}`);
        console.log(`Time difference: ${serverTimeDiffMs}ms`);
        
        return;
      }
    } catch (apiError) {
      console.warn('Secondary time API failed, trying browser-based time', apiError);
    }
    
    // Fallback method 1: Use the user's local time with EST timezone conversion
    try {
      const localTime = new Date();
      const estTime = new Date(localTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      
      // No time difference to store in this case since we're using local time directly
      serverTimeDiffMs = 0;
      lastSyncTime = localTime.getTime();
      
      console.log(`Using browser timezone API. Local time converted to EST: ${estTime.toISOString()}`);
      
      return;
    } catch (tzError) {
      console.warn('Browser timezone API failed, using localStorage fallback', tzError);
    }
    
    // Fallback method 2: Use localStorage to track time differences between sessions
    try {
      const localTime = new Date();
      const lastKnownTimeKey = '_fusdle_last_known_time';
      const lastRecordedTime = localStorage.getItem(lastKnownTimeKey);
      
      if (lastRecordedTime) {
        const timeDiff = localTime.getTime() - parseInt(lastRecordedTime);
        // If it's been more than 24 hours, assume it's a new day
        if (timeDiff > 24 * 60 * 60 * 1000) {
          console.log('Using localStorage fallback: More than 24 hours since last check');
          // Force a new day
          serverTimeDiffMs = 24 * 60 * 60 * 1000; // Add a day to current time
        } else {
          // Not enough time passed for a new day
          serverTimeDiffMs = 0;
        }
      } else {
        // First time using the app, just use local time
        serverTimeDiffMs = 0;
      }
      
      // Update the last known time
      localStorage.setItem(lastKnownTimeKey, localTime.getTime().toString());
      lastSyncTime = localTime.getTime();
      
      console.log(`Using localStorage fallback for time tracking`);
      return;
    } catch (lsError) {
      console.warn('localStorage not available for time tracking', lsError);
    }
    
    // Last resort: Just use the local time with no adjustments
    console.log('All time sync methods failed, using raw local time');
    serverTimeDiffMs = 0;
    lastSyncTime = new Date().getTime();
    
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

  // If no lastPuzzleDate is provided, we should show a new puzzle
  if (!lastPuzzleDate) {
    console.log('No lastPuzzleDate provided, showing new puzzle');
    return true;
  }
  
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
    console.warn('Method 1 failed: Global clock sync failed, trying other methods', error);
  }
  
  // Method 2: Use timeapi.io directly as a backup API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=America/New_York', {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      
      // Create a date string in YYYY-MM-DD format
      const currentDateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
      
      console.log(`Method 2 - Direct timeapi.io: Last date: ${lastPuzzleDate}, Current date: ${currentDateStr}`);
      if (currentDateStr !== lastPuzzleDate) {
        return true;
      }
    }
  } catch (error) {
    console.warn('Method 2 failed: Direct API call failed, trying browser timezone', error);
  }
  
  // Method 3: Use browser's timezone API (pretty reliable but can be manipulated)
  try {
    const nowLocal = new Date();
    const nowEST = new Date(nowLocal.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const estDateString = nowEST.toISOString().split('T')[0];
    
    console.log(`Method 3 - Browser timezone: Last date: ${lastPuzzleDate}, Current date: ${estDateString}`);
    if (estDateString !== lastPuzzleDate) {
      return true;
    }
  } catch (error) {
    console.warn('Method 3 failed: Browser timezone API failed, trying date comparison', error);
  }
  
  // Method 4: Simple date parsing and comparison
  try {
    // Parse both dates and compare them
    const lastDate = new Date(lastPuzzleDate);
    const currentDate = new Date();
    
    // Extract year, month, and day components
    const lastYear = lastDate.getFullYear();
    const lastMonth = lastDate.getMonth();
    const lastDay = lastDate.getDate();
    
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    // Create simple date objects for comparison (no time component)
    const lastDateSimple = new Date(lastYear, lastMonth, lastDay);
    const currentDateSimple = new Date(currentYear, currentMonth, currentDay);
    
    console.log(`Method 4 - Simple date comparison: Last date: ${lastDateSimple.toISOString().split('T')[0]}, Current: ${currentDateSimple.toISOString().split('T')[0]}`);
    
    // Check if current date is after last date
    if (currentDateSimple > lastDateSimple) {
      return true;
    }
  } catch (error) {
    console.warn('Method 4 failed: Simple date comparison failed, trying localStorage', error);
  }
  
  // Method 5: Simple date storage and comparison (fallback)
  // Store the last check time in memory and see if we've crossed midnight EST
  try {
    // Only used for this method
    const lastCheckKey = '_lastPuzzleTimeCheck';
    const puzzleDateKey = '_lastPuzzleDate';
    const lastCheckTime = localStorage.getItem(lastCheckKey);
    const storedPuzzleDate = localStorage.getItem(puzzleDateKey);
    const currentTime = new Date().getTime();
    
    // Store the current puzzle date
    localStorage.setItem(puzzleDateKey, lastPuzzleDate);
    
    // If the stored puzzle date is different or it's been more than 12 hours since our last check
    if (storedPuzzleDate !== lastPuzzleDate || 
        !lastCheckTime || 
        (currentTime - parseInt(lastCheckTime)) > 12 * 60 * 60 * 1000) {
      localStorage.setItem(lastCheckKey, currentTime.toString());
      console.log('Method 5: Date change or 12+ hours passed, suggesting refresh');
      return true;
    }
    
    localStorage.setItem(lastCheckKey, currentTime.toString());
  } catch (error) {
    console.warn('Method 5 failed: localStorage not available', error);
  }
  
  // Method 6: Last resort - allow manual refresh
  // At this point, we've tried everything, so we'll just return false
  // and let the user manually refresh with the button we added
  
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