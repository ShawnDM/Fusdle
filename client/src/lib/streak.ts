// localStorage keys for streak tracking
const STREAK_COUNT_KEY = 'fusdle_streakCount';
const LAST_PLAYED_DATE_KEY = 'fusdle_lastPlayedDate';
const FLAWLESS_STREAK_KEY = 'fusdle_flawlessStreak';
const HINTS_USED_KEY = 'fusdle_hintsUsed';

// Function to get the current streak from localStorage
export function getStreak(): number {
  const streakCount = localStorage.getItem(STREAK_COUNT_KEY);
  return streakCount ? parseInt(streakCount) : 0;
}

// Function to get the flawless streak (solving without hints)
export function getFlawlessStreak(): number {
  const flawlessStreak = localStorage.getItem(FLAWLESS_STREAK_KEY);
  return flawlessStreak ? parseInt(flawlessStreak) : 0;
}

// Function to get the last played date from localStorage
export function getLastPlayedDate(): string | null {
  return localStorage.getItem(LAST_PLAYED_DATE_KEY);
}

// Function to check if hints were used in today's puzzle
export function getHintsUsedToday(): boolean {
  const hintsUsed = localStorage.getItem(HINTS_USED_KEY);
  return hintsUsed === 'true';
}

// Function to mark that hints were used today and immediately reset flawless streak
export function markHintsUsed(): void {
  localStorage.setItem(HINTS_USED_KEY, 'true');
  // Immediately reset flawless streak when hints are used
  resetFlawlessStreak();
}

// Function to update the streak based on correct answer
export function updateStreak(correct: boolean): number {
  if (!correct) {
    // If the player fails, reset both streaks
    resetFlawlessStreak();
    resetStreak();
    console.log("Streak reset due to failed puzzle");
    return 0; // Return 0 as the new streak count
  }
  
  const lastPlayed = getLastPlayedDate();
  const today = new Date().toISOString().split('T')[0];
  
  // Already played today, don't update
  if (lastPlayed === today) {
    return getStreak();
  }
  
  let newStreak = 1; // Default to 1 for non-consecutive days
  
  if (lastPlayed) {
    // Check if lastPlayed was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastPlayed === yesterdayStr) {
      // Consecutive day, increment streak
      const currentStreak = getStreak();
      newStreak = currentStreak + 1;
    }
  }
  
  // Update regular streak
  localStorage.setItem(STREAK_COUNT_KEY, newStreak.toString());
  localStorage.setItem(LAST_PLAYED_DATE_KEY, today);
  
  // Update flawless streak if no hints were used
  updateFlawlessStreak(!getHintsUsedToday());
  
  // Reset hints used for the new day
  localStorage.removeItem(HINTS_USED_KEY);
  
  return newStreak;
}

// Update the flawless streak (days solved without hints)
function updateFlawlessStreak(flawless: boolean): number {
  if (!flawless) {
    resetFlawlessStreak();
    return 0;
  }
  
  const currentFlawlessStreak = getFlawlessStreak();
  const newFlawlessStreak = currentFlawlessStreak + 1;
  localStorage.setItem(FLAWLESS_STREAK_KEY, newFlawlessStreak.toString());
  return newFlawlessStreak;
}

// Reset flawless streak
export function resetFlawlessStreak(): void {
  localStorage.setItem(FLAWLESS_STREAK_KEY, '0');
}

// Function to reset streak
export function resetStreak(): void {
  localStorage.removeItem(STREAK_COUNT_KEY);
  localStorage.removeItem(LAST_PLAYED_DATE_KEY);
  localStorage.removeItem(FLAWLESS_STREAK_KEY);
  localStorage.removeItem(HINTS_USED_KEY);
}
