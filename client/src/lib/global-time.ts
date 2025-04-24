/**
 * Simplified Global Time Utility
 * A robust implementation focused on local date comparisons that minimizes errors
 * and external API calls, while providing reliable date transitions at midnight EST.
 */

// Local storage keys
const LAST_PUZZLE_DATE_KEY = 'fusdle_last_puzzle_date';
const LAST_CHECK_TIME_KEY = 'fusdle_last_check_time';

/**
 * Get today's date in YYYY-MM-DD format using the most reliable methods available
 * Prioritizes browser's timezone API but includes multiple fallbacks
 */
export async function getGlobalDateString(): Promise<string> {
  try {
    // Try browser timezone API (most reliable cross-browser solution)
    const todayBrowser = formatDateYYYYMMDD(
      new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    );
    console.log(`Today's date via browser timezone API: ${todayBrowser}`);
    return todayBrowser;
  } catch (error) {
    console.warn('Browser timezone API failed, using simple date', error);
    
    // Fallback to a simple date (less accurate but better than nothing)
    const todaySimple = formatDateYYYYMMDD(new Date());
    console.log(`Today's date via simple date: ${todaySimple}`);
    return todaySimple;
  }
}

/**
 * Format a date object to YYYY-MM-DD string
 */
function formatDateYYYYMMDD(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

/**
 * Determine if a new puzzle should be shown based on the last puzzle date
 * Returns true if we've crossed the midnight EST threshold since the last puzzle
 * 
 * This implementation uses multiple failsafes to ensure users get the correct puzzle
 * while minimizing external API calls and potential errors.
 */
export async function shouldShowNewPuzzle(lastPuzzleDate: string): Promise<boolean> {
  // If no lastPuzzleDate is provided, we should show a new puzzle
  if (!lastPuzzleDate) {
    console.log('No lastPuzzleDate provided, showing new puzzle');
    return true;
  }
  
  try {
    // Store the last date we checked for reference
    let storedLastPuzzleDate: string | null = null;
    try {
      storedLastPuzzleDate = localStorage.getItem(LAST_PUZZLE_DATE_KEY);
    } catch (e) {
      console.warn('Failed to read from localStorage', e);
    }
    
    // Check if the stored date doesn't match the passed date
    // This helps catch cases where the app state might be inconsistent
    if (storedLastPuzzleDate && storedLastPuzzleDate !== lastPuzzleDate) {
      console.log(`Puzzle date mismatch - Stored: ${storedLastPuzzleDate}, Last: ${lastPuzzleDate}`);
      
      // Store the current passed date
      try {
        localStorage.setItem(LAST_PUZZLE_DATE_KEY, lastPuzzleDate);
      } catch (e) {
        console.warn('Failed to write to localStorage', e);
      }
      
      // The dates are different, so we should show a new puzzle
      return true;
    }
    
    // Get today's date using browser methods (no external API calls)
    const today = await getGlobalDateString();
    
    console.log(`Date comparison: Last date: ${lastPuzzleDate}, Today: ${today}`);
    
    // If today's date is different from the last puzzle date, we need a new puzzle
    if (today !== lastPuzzleDate) {
      console.log('Date changed detected - showing new puzzle');
      return true;
    }
    
    // Implement a time-based failsafe - if it's been more than 12 hours since
    // we last checked, suggest a refresh to help with timezone edge cases
    try {
      const lastCheckTimeStr = localStorage.getItem(LAST_CHECK_TIME_KEY);
      const currentTime = Date.now();
      
      if (!lastCheckTimeStr || (currentTime - parseInt(lastCheckTimeStr)) > 12 * 60 * 60 * 1000) {
        console.log('More than 12 hours since last check, suggesting refresh');
        localStorage.setItem(LAST_CHECK_TIME_KEY, currentTime.toString());
        return true;
      }
      
      // Update the last check time
      localStorage.setItem(LAST_CHECK_TIME_KEY, currentTime.toString());
    } catch (e) {
      console.warn('Failed to manage check timestamps', e);
    }
    
    // All checks passed, no date change detected
    console.log('All checks complete - no date change detected');
    return false;
  } catch (error) {
    // If anything fails, log it but return false to avoid unexpected behavior
    console.error('Error checking for date change:', error);
    return false;
  }
}