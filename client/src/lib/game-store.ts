import { create } from 'zustand';
import { apiRequest, getApiBaseUrl } from './queryClient';
import { updateStreak, getStreak, getFlawlessStreak, markHintsUsed } from './streak';
import { firestoreService } from '../firebase/firestore';
import { getGlobalDateString, shouldShowNewPuzzle } from './global-time';
import { calculateFusdleNumber } from './utils';

// Helper functions to manage completed puzzles in localStorage
const COMPLETED_PUZZLES_KEY = 'fusdle_completed_puzzles';
const PUZZLE_ATTEMPTS_KEY = 'fusdle_puzzle_attempts';
const PUZZLE_STATUS_KEY = 'fusdle_puzzle_status';

interface CompletedPuzzleData {
  id: number;
  attempts: number;
  status: 'won' | 'lost';
}

export async function saveCompletedPuzzle(puzzleId: number, attemptsCount: number, status: 'won' | 'lost', difficulty: string = 'normal'): Promise<void> {
  try {
    // Save puzzle ID to completed list (now includes difficulty)
    const completedPuzzleIds = getCompletedPuzzlesIds();
    const difficultySpecificId = `${puzzleId}_${difficulty}`;
    
    if (!completedPuzzleIds.includes(difficultySpecificId)) {
      completedPuzzleIds.push(difficultySpecificId);
      localStorage.setItem(COMPLETED_PUZZLES_KEY, JSON.stringify(completedPuzzleIds));
    }
    
    // Save the puzzle attempts and status data
    const puzzleData: CompletedPuzzleData = {
      id: puzzleId,
      attempts: attemptsCount,
      status: status
    };
    
    const savedAttempts = getPuzzleAttemptsData();
    // Store with difficulty-specific key
    savedAttempts[`${puzzleId}_${difficulty}`] = puzzleData;
    localStorage.setItem(PUZZLE_ATTEMPTS_KEY, JSON.stringify(savedAttempts));
    
    // Mark puzzle as completed for this specific difficulty
    localStorage.setItem(`fusdle_${puzzleId}_${difficulty}_completed`, 'true');
    
    // If normal puzzle is completed, unlock hard mode
    if (difficulty === 'normal') {
      useGameStore.setState({ hardModeUnlocked: true });
      
      try {
        // Get today's date using the global time API
        const globalDateStr = await getGlobalDateString();
        localStorage.setItem('lastCompletionDate', globalDateStr);
      } catch (error) {
        console.error('Error getting global date, using local time fallback:', error);
        // Fallback to local time if global time API fails
        const options = { timeZone: 'America/New_York' };
        const todayDateEST = new Date().toLocaleDateString('en-US', options);
        localStorage.setItem('lastCompletionDate', todayDateEST);
      }
    }
  } catch (error) {
    console.error('Error saving completed puzzle:', error);
  }
}

export function getCompletedPuzzlesIds(): Array<string> {
  try {
    const savedPuzzles = localStorage.getItem(COMPLETED_PUZZLES_KEY);
    return savedPuzzles ? JSON.parse(savedPuzzles) : [];
  } catch (error) {
    console.error('Error getting completed puzzles:', error);
    return [];
  }
}

export function getPuzzleAttemptsData(): Record<string, CompletedPuzzleData> {
  try {
    const savedData = localStorage.getItem(PUZZLE_ATTEMPTS_KEY);
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    console.error('Error getting puzzle attempts data:', error);
    return {};
  }
}

export function getPuzzleData(puzzleId: number, difficulty: string = 'normal'): CompletedPuzzleData | null {
  const attemptsData = getPuzzleAttemptsData();
  const key = `${puzzleId}_${difficulty}`;
  // Need to do this type of access for TypeScript
  return key in attemptsData ? attemptsData[key] : null;
}

export function isPuzzleCompleted(puzzleId: number, difficulty: string = 'normal'): boolean {
  const key = `${puzzleId}_${difficulty}`;
  return getCompletedPuzzlesIds().includes(key);
}

export interface Puzzle {
  id: number;
  puzzleNumber: number;
  date: string;
  difficulty: string;
  emojis: string[];
  answer?: string;
  hints?: string[];
  isFusionTwist: number;
  twistType: string | null;
  wordCount?: number;
}

interface GameState {
  puzzle: Puzzle | null;
  // Cache for both difficulty modes to allow seamless switching
  cachedPuzzles: {
    normal: Puzzle | null;
    hard: Puzzle | null;
  };
  cachedGameStates: {
    normal: {
      attempts: number;
      revealedHints: string[];
      hintsUsedAtAttempts: number[];
      previousGuesses: string[];
      gameStatus: 'playing' | 'won' | 'lost' | 'gave_up';
      hasCompleted: boolean;
      hasGuessedOnce: boolean;
      partialMatchFeedback: string | null;
      matchedWord: string | null;
    } | null;
    hard: {
      attempts: number;
      revealedHints: string[];
      hintsUsedAtAttempts: number[];
      previousGuesses: string[];
      gameStatus: 'playing' | 'won' | 'lost' | 'gave_up';
      hasCompleted: boolean;
      hasGuessedOnce: boolean;
      partialMatchFeedback: string | null;
      matchedWord: string | null;
    } | null;
  };
  loading: boolean;
  error: string | null;
  gameStatus: 'playing' | 'won' | 'lost' | 'gave_up';
  attempts: number;
  revealedHints: string[];
  hintsUsedAtAttempts: number[];
  previousGuesses: string[]; // Track all previous guesses made by the user
  currentGuess: string;
  hasCompleted: boolean;
  partialMatchFeedback: string | null; // Feedback for partial word matches
  matchedWord: string | null; // The specific matched word from partial match
  matchType: string | null; // Type of match (primary, exact, substring, wrong-order)
  hasCorrectWordsWrongOrder: boolean; // Flag for when words are correct but in wrong order
  hasGuessedOnce: boolean; // Track if user has made at least one guess
  // Tutorial visibility states
  showNormalModeTutorial: boolean;
  showHardModeTutorial: boolean;
  // Function to dismiss tutorial popups
  dismissTutorial: (mode: 'normal' | 'hard') => void;
  // Game functions
  fetchTodaysPuzzle: () => Promise<void>;
  fetchPuzzleByDifficulty: (difficulty: string) => Promise<void>;
  fetchRandomPuzzle: (puzzleType?: string) => Promise<void>; // Development-only function to fetch random puzzles
  submitGuess: (guess: string) => Promise<boolean>;
  giveUp: () => Promise<void>; // New function to give up
  revealHint: () => Promise<string | null>;
  setCurrentGuess: (guess: string) => void;
  resetGame: () => void;
  resetForDevelopment: () => void; // Special development-only reset function
  streak: number;
  flawlessStreak: number;
  difficultyMode: 'normal' | 'hard';
  hardModeUnlocked: boolean;
  toggleDifficultyMode: () => void;
  shareResult: () => string;
  checkCompletedStatus: () => void;
  // Caching functions
  cacheCurrentGameState: () => void;
  loadGameStateFromCache: (difficulty: 'normal' | 'hard') => void;
}

// Function to check if hard mode should be reset at midnight EST
// Uses cached date for initial load, but will properly sync with global time
async function shouldResetHardMode(): Promise<boolean> {
  const lastCompletionDate = localStorage.getItem('lastCompletionDate');
  
  // If no record exists yet, hard mode should be locked
  if (!lastCompletionDate) {
    return true;
  }
  
  // Check if we've passed the 4 AM EST threshold since the last completion
  try {
    // Use our global time utility that checks with world time API
    return await shouldShowNewPuzzle(lastCompletionDate);
  } catch (error) {
    console.error('Error checking global time, falling back to local time:', error);
    
    // Fallback to local time if global time check fails
    const options = { timeZone: 'America/New_York' };
    const todayDateEST = new Date().toLocaleDateString('en-US', options);
    
    // If the last completion date is not today, reset hard mode
    return lastCompletionDate !== todayDateEST;
  }
}

// Get initial hard mode status, resetting if it's a new day
// Uses cached value first for immediate UI rendering, then updates async
function getInitialHardModeStatus(): boolean {
  // For initial load, use the stored value to prevent UI jumping
  const storedValue = localStorage.getItem('hardModeUnlocked') === 'true';
  
  // Check reset condition asynchronously to update if needed
  (async () => {
    if (await shouldResetHardMode()) {
      localStorage.removeItem('hardModeUnlocked');
      // Update the state if reset was needed
      useGameStore.setState({ hardModeUnlocked: false });
    }
  })();
  
  // Return the cached value for immediate rendering
  return storedValue;
}

// New function to persist current game state to localStorage
function persistGameState(state: Partial<GameState>) {
  if (!state.puzzle) return;
  
  const stateToSave = {
    attempts: state.attempts || 0,
    revealedHints: state.revealedHints || [],
    hintsUsedAtAttempts: state.hintsUsedAtAttempts || [],
    previousGuesses: state.previousGuesses || [],
    gameStatus: state.gameStatus || 'playing',
    hasCompleted: state.hasCompleted || false,
    hasGuessedOnce: state.hasGuessedOnce || false,
    partialMatchFeedback: state.partialMatchFeedback || null,
  };
  
  try {
    const gameStateKey = `fusdle_game_state_${state.puzzle.id}_${state.difficultyMode}`;
    localStorage.setItem(gameStateKey, JSON.stringify(stateToSave));
    console.log('Game state persisted to localStorage');
  } catch (error) {
    console.error('Error persisting game state:', error);
  }
}

// Function to load persisted game state
function loadPersistedGameState(puzzleId: number, difficultyMode: string): Partial<GameState> | null {
  try {
    const gameStateKey = `fusdle_game_state_${puzzleId}_${difficultyMode}`;
    const savedState = localStorage.getItem(gameStateKey);
    
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Error loading persisted game state:', error);
  }
  
  return null;
}

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  // Initialize cache for both puzzle difficulties
  cachedPuzzles: {
    normal: null,
    hard: null
  },
  // Initialize cache for both game states
  cachedGameStates: {
    normal: null,
    hard: null
  },
  loading: false,
  error: null,
  gameStatus: 'playing',
  attempts: 0,
  revealedHints: [],
  hintsUsedAtAttempts: [],
  previousGuesses: [], // Track all previous guesses made by the user
  currentGuess: '',
  hasCompleted: false,
  hasGuessedOnce: false, // Track if user has made at least one guess
  partialMatchFeedback: null, // Initialize partial match feedback
  matchedWord: null, // Initialize matched word for highlighting partial matches
  matchType: null, // Initialize match type as null
  hasCorrectWordsWrongOrder: false, // Initialize wrong order flag as false
  
  // Tutorial states - get from localStorage or show by default if not seen
  // Also check for explicit show flags that can be set to force tutorial display
  showNormalModeTutorial: localStorage.getItem('fusdle_normal_tutorial_shown') !== 'true' || 
                          localStorage.getItem('fusdle_show_normal_tutorial') === 'true',
  showHardModeTutorial: localStorage.getItem('fusdle_hard_tutorial_shown') !== 'true' ||
                        localStorage.getItem('fusdle_show_hard_tutorial') === 'true',
  
  streak: getStreak(),
  flawlessStreak: getFlawlessStreak(),
  difficultyMode: 'normal' as 'normal' | 'hard',
  hardModeUnlocked: getInitialHardModeStatus(),
  
  // Function to dismiss tutorial popups
  dismissTutorial: (mode: 'normal' | 'hard') => {
    if (mode === 'normal') {
      localStorage.setItem('fusdle_normal_tutorial_shown', 'true');
      localStorage.removeItem('fusdle_show_normal_tutorial'); // Clear any show flag
      set({ showNormalModeTutorial: false });
    } else if (mode === 'hard') {
      localStorage.setItem('fusdle_hard_tutorial_shown', 'true');
      localStorage.removeItem('fusdle_show_hard_tutorial'); // Clear any show flag
      set({ showHardModeTutorial: false });
    }
  },
  
  checkCompletedStatus: () => {
    const { puzzle, hasCompleted, difficultyMode } = get();
    
    // Only proceed if we have a puzzle and haven't already marked it as completed
    if (!puzzle || hasCompleted) return;
    
    // First, try to load any persisted game state for this puzzle
    try {
      // Check for persisted game state in localStorage
      const gameStateKey = `fusdle_game_state_${puzzle.id}_${difficultyMode}`;
      const savedGameState = localStorage.getItem(gameStateKey);
      
      if (savedGameState) {
        console.log('Found saved game state, attempting to restore...');
        const parsedState = JSON.parse(savedGameState);
        
        // Only restore if we have valid data
        if (parsedState && typeof parsedState === 'object') {
          set({
            attempts: parsedState.attempts || 0,
            revealedHints: parsedState.revealedHints || [],
            hintsUsedAtAttempts: parsedState.hintsUsedAtAttempts || [],
            previousGuesses: parsedState.previousGuesses || [],
            gameStatus: parsedState.gameStatus || 'playing',
            hasCompleted: parsedState.hasCompleted || false,
            hasGuessedOnce: parsedState.hasGuessedOnce || false,
            partialMatchFeedback: parsedState.partialMatchFeedback || null,
          });
          
          console.log('Successfully restored game state from localStorage');
          
          // If the game is already completed in the saved state, also load the answer
          if (parsedState.hasCompleted && parsedState.gameStatus === 'won') {
            // Try to get cached answer
            const cachedAnswerKey = `fusdle_answer_${puzzle.id}_${difficultyMode}`;
            const cachedAnswer = localStorage.getItem(cachedAnswerKey);
            
            if (cachedAnswer) {
              set({
                puzzle: { ...puzzle, answer: cachedAnswer }
              });
            }
          }
          
          // After loading saved state, check if we need to continue with regular completion check
          if (parsedState.hasCompleted) {
            return; // We've already restored a completed game state
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved game state:', error);
    }
    
    // If we get here, either there was no saved state, or it wasn't a completed state
    // Continue with the normal completed status check
    const savedPuzzleData = getPuzzleData(puzzle.id, difficultyMode);
    const completedKey = `fusdle_${puzzle.id}_${difficultyMode}_completed`;
    const isPuzzleCompletedForDifficulty = localStorage.getItem(completedKey) === 'true';
    
    if (isPuzzleCompletedForDifficulty) {
      // Use cached answer if available to reduce API calls  
      const cachedAnswerKey = `fusdle_answer_${puzzle.id}_${difficultyMode}`;
      const cachedAnswer = localStorage.getItem(cachedAnswerKey);
      
      if (cachedAnswer) {
        // Use cached answer instead of fetching
        set({ 
          hasCompleted: true,
          gameStatus: savedPuzzleData?.status || 'won',
          attempts: savedPuzzleData?.attempts || 0,
          puzzle: { ...puzzle, answer: cachedAnswer }
        });
      } else {
        // Fetch the answer if not cached
        fetch(`${getApiBaseUrl()}/api/puzzles/${puzzle.id}/answer?revealAnswer=true&difficulty=${difficultyMode}`)
          .then(response => response.json())
          .then(data => {
            // Cache the answer with difficulty
            localStorage.setItem(cachedAnswerKey, data.answer);
            
            set({ 
              hasCompleted: true,
              gameStatus: savedPuzzleData?.status || 'won',
              attempts: savedPuzzleData?.attempts || 0,
              puzzle: { ...puzzle, answer: data.answer }
            });
          })
          .catch(error => console.error('Error fetching answer for completed puzzle:', error));
      }
    } else {
      // If not completed for this difficulty, mark as not completed
      set({ hasCompleted: false });
    }
  },

  fetchTodaysPuzzle: async () => {
    set({ loading: true, error: null });
    try {
      // Use current difficulty mode when fetching today's puzzle
      const { difficultyMode } = get();
      
      // For hard mode, ensure it's unlocked - default to normal if not
      const effectiveDifficulty = 
        difficultyMode === 'hard' && !get().hardModeUnlocked 
          ? 'normal' 
          : difficultyMode;
      
      // Try Firebase service first
      let puzzle = null;
      
      try {
        // Try to fetch from Firebase using our service
        puzzle = await firestoreService.getTodaysPuzzle(effectiveDifficulty);
      } catch (firebaseError) {
        console.warn('Firebase fetch failed, trying API endpoint:', firebaseError);
      }
      
      // If Firebase fetch fails, use our API endpoint
      if (!puzzle) {
        const apiUrl = `${getApiBaseUrl()}/api/puzzles/today?difficulty=${effectiveDifficulty}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch today's ${effectiveDifficulty} puzzle`);
        }
        
        puzzle = await response.json();
      }
      
      // Update the puzzle and mode in state
      set({ 
        puzzle, 
        loading: false,
        difficultyMode: effectiveDifficulty as 'normal' | 'hard'
      });
      
      // Cache this puzzle for the current difficulty mode
      set((state) => ({
        cachedPuzzles: {
          ...state.cachedPuzzles,
          [effectiveDifficulty]: puzzle
        }
      }));
      
      // Check if the puzzle has already been completed
      setTimeout(() => get().checkCompletedStatus(), 10);
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },

  submitGuess: async (guess: string) => {
    const { puzzle, attempts, difficultyMode, previousGuesses } = get();
    
    if (!puzzle) {
      return false;
    }

    try {
      // Create URL with parameters
      let apiUrl = `${getApiBaseUrl()}/api/puzzles/${puzzle.id}/guess?difficulty=${difficultyMode}`;
      
      // Add puzzleType parameter for fusion twist puzzles
      if (puzzle.isFusionTwist) {
        apiUrl += '&puzzleType=fusion';
      }
      
      // We need to keep partial matches across guesses, so we're no longer clearing them here
      // Define the storage key to use below
      const storageKey = `fusdle_partial_${puzzle.id}_${difficultyMode}`;
      
      const response = await apiRequest('POST', apiUrl, { guess });
      const data = await response.json();
      
      // Update partial match feedback if it exists
      if (data.partialMatchFeedback) {
        // Store feedback, matched word, match type, and wrong order flag
        set({ 
          partialMatchFeedback: data.partialMatchFeedback,
          matchedWord: data.matchedWord || null,  // Store matched word from server
          matchType: data.matchType || null,      // Store match type
          hasCorrectWordsWrongOrder: data.hasCorrectWordsWrongOrder || false  // Store wrong order flag
        });
        
        // If we have a wrong order match, save it to localStorage
        if (data.hasCorrectWordsWrongOrder && data.matchType === 'wrong-order') {
          try {
            const wrongOrderKey = `fusdle_wrong_order_${puzzle.id}_${difficultyMode}`;
            let wrongOrderGuesses: number[] = [];
            const storedWrongOrderGuesses = localStorage.getItem(wrongOrderKey);
            
            if (storedWrongOrderGuesses) {
              wrongOrderGuesses = JSON.parse(storedWrongOrderGuesses);
            }
            
            if (!wrongOrderGuesses.includes(attempts)) {
              wrongOrderGuesses.push(attempts);
              localStorage.setItem(wrongOrderKey, JSON.stringify(wrongOrderGuesses));
              console.log(`Saved wrong order match for attempt ${attempts}`);
            }
          } catch (e) {
            console.error('Error storing wrong order data:', e);
          }
        }
        
        // Save this attempt as having a partial match
        try {
          // Use the storageKey defined above
          let partialMatches = [];
          const storedPartialMatches = localStorage.getItem(storageKey);
          
          if (storedPartialMatches) {
            partialMatches = JSON.parse(storedPartialMatches);
          }
          
          console.log('Current partial matches before update:', partialMatches);
          
          // Add current attempt to the partial matches - note we use attempts (0-based index)
          // This is critical because we use a 0-based index when generating the results
          if (!partialMatches.includes(attempts)) {
            partialMatches.push(attempts);
            
            // Store for current game mode
            localStorage.setItem(storageKey, JSON.stringify(partialMatches));
            
            // For fusion puzzles, also save to fusion-specific key
            if (puzzle.isFusionTwist) {
              const fusionKey = `fusdle_partial_fusion_${puzzle.puzzleNumber}`;
              localStorage.setItem(fusionKey, JSON.stringify(partialMatches));
            }
            
            // Also store the matched word for this attempt, which helps with highlighting
            if (data.matchedWord) {
              const matchedWordsKey = `fusdle_matched_words_${puzzle.id}_${difficultyMode}`;
              let matchedWords: Record<string, string> = {};
              try {
                const storedMatchedWords = localStorage.getItem(matchedWordsKey);
                if (storedMatchedWords) {
                  matchedWords = JSON.parse(storedMatchedWords);
                }
                matchedWords[attempts.toString()] = data.matchedWord;
                localStorage.setItem(matchedWordsKey, JSON.stringify(matchedWords));
                console.log(`Saved matched word "${data.matchedWord}" for attempt ${attempts}`);
              } catch (e) {
                console.error('Error storing matched word:', e);
              }
            }
            
            console.log('Saved partial match for attempt:', attempts);
            console.log('Updated partial matches array:', partialMatches);
          } else {
            console.log('Attempt already in partial matches:', attempts);
          }
        } catch (e) {
          console.error('Error saving partial match:', e);
        }
      } else {
        set({ 
          partialMatchFeedback: null, 
          matchedWord: null,
          matchType: null,
          hasCorrectWordsWrongOrder: false 
        });
      }
      
      // Increment attempts, set hasGuessedOnce to true, and add guess to previousGuesses
      set(state => ({ 
        attempts: state.attempts + 1,
        hasGuessedOnce: true,
        previousGuesses: [...state.previousGuesses, guess]
      }));
      
      // Get the new attempts count after increment
      const newAttempts = get().attempts;
      
      // Save the current game state to persist across navigation
      const currentState = get();
      persistGameState(currentState);
      
      if (data.isCorrect) {
        // Update game state for correct guess
        const newStreak = updateStreak(true);
        
        // If this is a Normal mode puzzle, unlock Hard mode
        const hardModeUnlocked = difficultyMode === 'normal' || get().hardModeUnlocked;
        
        // Get the updated flawless streak value
        const newFlawlessStreak = getFlawlessStreak();
        
        set({ 
          gameStatus: 'won', 
          puzzle: { ...puzzle, answer: data.answer },
          streak: newStreak,
          flawlessStreak: newFlawlessStreak,
          hasCompleted: true,
          hardModeUnlocked
        });
        
        // If hard mode just unlocked, show a notification in console
        if (hardModeUnlocked && !get().hardModeUnlocked && difficultyMode === 'normal') {
          console.log('Hard mode unlocked! You can now toggle difficulty.');
        }
        
        // Save to localStorage that this puzzle has been completed with attempts
        saveCompletedPuzzle(puzzle.id, newAttempts, 'won', difficultyMode);
        
        // Save unlocked status to localStorage
        if (hardModeUnlocked) {
          localStorage.setItem('hardModeUnlocked', 'true');
        }
        
        // Save the final game state again after setting won status
        persistGameState(get());
        
        return true;
      } else {
        // Incorrect guess, but we continue with unlimited attempts model
        return false;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error submitting guess' 
      });
      return false;
    }
  },

  fetchPuzzleByDifficulty: async (difficulty: string) => {
    set({ loading: true, error: null });
    try {
      // Try Firebase service first
      let puzzle = null;
      
      // Fix type safety
      const safeMode = (difficulty === 'hard' || difficulty === 'normal') 
        ? difficulty 
        : 'normal';
      
      console.log(`Explicitly fetching puzzle with difficulty: ${safeMode}`);
      
      try {
        // Try to fetch from Firebase using our service
        puzzle = await firestoreService.getTodaysPuzzle(safeMode);
        
        // Log the retrieved puzzle difficulty to verify
        if (puzzle) {
          console.log(`Retrieved puzzle with difficulty: ${puzzle.difficulty}`);
          
          // Ensure the puzzle has the correct difficulty property
          if (puzzle.difficulty !== safeMode) {
            console.warn(`Fixing puzzle difficulty mismatch: ${puzzle.difficulty} → ${safeMode}`);
            puzzle.difficulty = safeMode;
          }
        }
      } catch (firebaseError) {
        console.warn('Firebase fetch failed, trying API endpoint:', firebaseError);
      }
      
      // If Firebase fetch fails, use our API endpoint
      if (!puzzle) {
        const apiUrl = `${getApiBaseUrl()}/api/puzzles/today?difficulty=${safeMode}`;
        console.log(`Fetching from API with URL: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${safeMode} difficulty puzzle`);
        }
        
        puzzle = await response.json();
        console.log(`API returned puzzle with difficulty: ${puzzle.difficulty}`);
        
        // Ensure the puzzle has the correct difficulty property
        if (puzzle.difficulty !== safeMode) {
          console.warn(`API puzzle difficulty mismatch: ${puzzle.difficulty} → ${safeMode}`);
          puzzle.difficulty = safeMode;
        }
      }
      
      // Reset game state for the new difficulty
      set({ 
        puzzle, 
        loading: false,
        difficultyMode: safeMode as 'normal' | 'hard',
        gameStatus: 'playing' as const,
        attempts: 0,
        revealedHints: [],
        hintsUsedAtAttempts: [],
        previousGuesses: [],
        currentGuess: '',
        hasCompleted: false,
        hasGuessedOnce: false,
        partialMatchFeedback: null
      });
      
      // Also cache this puzzle and new game state
      set((state) => ({
        cachedPuzzles: {
          ...state.cachedPuzzles,
          [safeMode]: puzzle
        },
        cachedGameStates: {
          ...state.cachedGameStates,
          [safeMode]: {
            attempts: 0,
            revealedHints: [],
            hintsUsedAtAttempts: [],
            previousGuesses: [],
            gameStatus: 'playing' as const,
            hasCompleted: false,
            hasGuessedOnce: false,
            partialMatchFeedback: null
          }
        }
      }));
      
      // Check if the puzzle has already been completed with a longer delay
      setTimeout(() => get().checkCompletedStatus(), 50);
    } catch (error) {
      console.error(`Error fetching ${difficulty} puzzle:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },
  
  // Function to cache the current game state for the current difficulty
  cacheCurrentGameState: () => {
    const { 
      puzzle, 
      difficultyMode, 
      attempts, 
      revealedHints, 
      hintsUsedAtAttempts, 
      previousGuesses,
      gameStatus, 
      hasCompleted, 
      hasGuessedOnce,
      partialMatchFeedback,
      matchedWord
    } = get();
    
    // Save current state to the cache
    set((state) => ({
      cachedPuzzles: {
        ...state.cachedPuzzles,
        [difficultyMode]: puzzle
      },
      cachedGameStates: {
        ...state.cachedGameStates,
        [difficultyMode]: {
          attempts,
          revealedHints,
          hintsUsedAtAttempts,
          previousGuesses,
          gameStatus,
          hasCompleted,
          hasGuessedOnce,
          partialMatchFeedback,
          matchedWord
        }
      }
    }));
    
    console.log(`Cached ${difficultyMode} mode state`);
  },
  
  // Function to load a game state from the cache based on difficulty
  loadGameStateFromCache: (difficulty: 'normal' | 'hard'): boolean => {
    const { cachedPuzzles, cachedGameStates } = get();
    
    // Check if we have cached data for this difficulty
    if (cachedPuzzles[difficulty] && cachedGameStates[difficulty]) {
      // Use appropriate type to avoid void returns
      const cachedState = cachedGameStates[difficulty]!;
      
      try {
        set({
          puzzle: cachedPuzzles[difficulty],
          difficultyMode: difficulty,
          attempts: cachedState.attempts,
          revealedHints: cachedState.revealedHints,
          hintsUsedAtAttempts: cachedState.hintsUsedAtAttempts,
          previousGuesses: cachedState.previousGuesses || [], // Include previous guesses
          gameStatus: cachedState.gameStatus,
          hasCompleted: cachedState.hasCompleted,
          hasGuessedOnce: cachedState.hasGuessedOnce,
          partialMatchFeedback: cachedState.partialMatchFeedback,
          matchedWord: cachedState.matchedWord || null,
          loading: false,
          error: null
        });
        
        console.log(`Loaded ${difficulty} mode state from cache`);
        return true;
      } catch (error) {
        console.error(`Error loading cached state for ${difficulty} mode:`, error);
        return false;
      }
    }
    
    console.log(`No cached state found for ${difficulty} mode`);
    return false;
  },
  
  toggleDifficultyMode: () => {
    const { difficultyMode, hardModeUnlocked, loading } = get();
    
    // Prevent toggling while loading
    if (loading) {
      console.log('Please wait, puzzle is still loading...');
      return;
    }
    
    // Can only toggle if hard mode is unlocked
    if (!hardModeUnlocked && difficultyMode === 'normal') {
      console.log('Hard mode is locked until you complete today\'s normal puzzle');
      return;
    }
    
    // Indicate loading state immediately to prevent multiple toggles
    set({ loading: true });
    
    // Cache current game state before switching
    get().cacheCurrentGameState();
    
    // Switch to the new mode
    const newMode = difficultyMode === 'normal' ? 'hard' : 'normal';
    console.log(`Switching from ${difficultyMode} to ${newMode} mode`);
    
    // First clear the current puzzle to ensure we don't see stale data
    set({
      puzzle: null,
      loading: true,
      difficultyMode: newMode // Set this immediately to update UI
    });
    
    // More substantial delay to ensure proper state updates
    setTimeout(() => {
      try {
        // Try to load from cache first
        const cacheLoaded = get().loadGameStateFromCache(newMode);
        
        if (typeof cacheLoaded === 'boolean' && cacheLoaded) {
          // Successfully loaded from cache, verify difficultyMode is set correctly
          console.log(`Successfully switched to ${newMode} mode using cached data`);
          // Double-check that difficulty mode is set correctly
          if (get().difficultyMode !== newMode) {
            set({ difficultyMode: newMode });
          }
        } else {
          // No cache available, fetch from server
          console.log(`No cache available for ${newMode} mode, fetching from server`);
          
          // Reset game state before fetching
          set({
            difficultyMode: newMode, // Ensure this is set again for safety
            loading: true,
            attempts: 0,
            revealedHints: [],
            hintsUsedAtAttempts: [],
            previousGuesses: [],
            gameStatus: 'playing',
            hasGuessedOnce: false,
            hasCompleted: false,
            partialMatchFeedback: null,
            matchedWord: null,
            currentGuess: ''
          });
          
          // Fetch the puzzle for the new mode with explicit difficulty parameter
          get().fetchPuzzleByDifficulty(newMode);
        }
      } catch (error) {
        console.error("Error toggling difficulty mode:", error);
        // Ensure we're not stuck in loading state if an error occurs
        set({ loading: false });
      }
    }, 100);
  },

  revealHint: async () => {
    const { puzzle, revealedHints, difficultyMode, attempts, hintsUsedAtAttempts } = get();
    
    if (!puzzle) {
      return null;
    }
    
    // Check if we have enough guesses to reveal a hint (1 hint per guess)
    if (attempts <= revealedHints.length) {
      console.log('Make another guess to unlock a hint');
      return null;
    }
    
    // The most recent hint should have been for a previous attempt, not the current one
    // This prevents getting consecutive hints without making a new guess in between
    // Changed attempts-1 to attempts since we compare against the attempt when the hint was used
    if (hintsUsedAtAttempts.length > 0 && hintsUsedAtAttempts[hintsUsedAtAttempts.length - 1] === attempts) {
      console.log('Make another guess to unlock a hint');
      console.log('Debug - hintsUsedAtAttempts:', hintsUsedAtAttempts, 'Current attempts:', attempts);
      return null;
    }
    
    // Check if we've already revealed all available hints
    const totalAvailableHints = puzzle?.hints?.length || 3;
    if (revealedHints.length >= totalAvailableHints) {
      console.log('No more hints available');
      return null;
    }
    
    const hintIndex = revealedHints.length;
    
    try {
      // Create URL with parameters
      let url = `${getApiBaseUrl()}/api/puzzles/${puzzle.id}/hints/${hintIndex}?difficulty=${difficultyMode}`;
      
      // Add puzzleType parameter for fusion twist puzzles
      if (puzzle.isFusionTwist) {
        url += '&puzzleType=fusion';
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hint');
      }
      
      const data = await response.json();
      const newHint = data.hint;
      
      // Mark that hints were used (affects flawless streak)
      markHintsUsed();
      
      // Reset flawless streak immediately
      const newFlawlessStreak = 0;
      
      // Add current attempt to the hintsUsedAtAttempts array
      set(state => ({ 
        revealedHints: [...state.revealedHints, newHint],
        hintsUsedAtAttempts: [...state.hintsUsedAtAttempts, attempts],
        flawlessStreak: newFlawlessStreak
      }));
      
      return newHint;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error revealing hint' 
      });
      return null;
    }
  },

  giveUp: async () => {
    const { puzzle, difficultyMode, attempts } = get();
    
    if (!puzzle) {
      return;
    }

    try {
      // Create URL for revealing answer
      let answerUrl = `${getApiBaseUrl()}/api/puzzles/${puzzle.id}/answer?revealAnswer=true&difficulty=${difficultyMode}`;
      
      // Add puzzleType parameter for fusion twist puzzles
      if (puzzle.isFusionTwist) {
        answerUrl += '&puzzleType=fusion';
      }
      
      const answerResponse = await fetch(answerUrl);
      
      // Reset streak as the player gave up
      updateStreak(false);
      
      if (answerResponse.ok) {
        const answerData = await answerResponse.json();
        
        // If this is a Normal mode puzzle, unlock Hard mode (even on give up)
        const hardModeUnlocked = difficultyMode === 'normal' || get().hardModeUnlocked;
        
        set({ 
          gameStatus: 'gave_up',
          puzzle: { ...puzzle, answer: answerData.answer },
          hasCompleted: true,
          hardModeUnlocked
        });
        
        // Save to localStorage that this puzzle has been completed
        saveCompletedPuzzle(puzzle.id, attempts, 'lost', difficultyMode);
        
        // Save unlocked status to localStorage
        if (hardModeUnlocked) {
          localStorage.setItem('hardModeUnlocked', 'true');
        }
      } else {
        // Fallback in case the API fails
        set({ 
          gameStatus: 'gave_up',
          puzzle: { ...puzzle, answer: 'Answer unavailable' },
          hasCompleted: true
        });
        
        // Save to localStorage that this puzzle has been completed
        saveCompletedPuzzle(puzzle.id, attempts, 'lost', difficultyMode);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error giving up' 
      });
    }
  },

  setCurrentGuess: (guess: string) => {
    set({ currentGuess: guess });
  },

  resetGame: () => {
    const { puzzle, difficultyMode } = get();
    // Check if it's a new day to reset tutorial flags
    const todayDate = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
    const lastPlayedDate = localStorage.getItem('fusdle_last_played_date');
    
    // Clear partial matches storage for the current puzzle
    if (puzzle) {
      // Remove partial match tracking from localStorage
      const storageKey = `fusdle_partial_${puzzle.id}_${difficultyMode}`;
      localStorage.removeItem(storageKey);
      
      // Also clear fusion-specific key if needed
      if (puzzle.isFusionTwist) {
        const fusionKey = `fusdle_partial_fusion_${puzzle.puzzleNumber}`;
        localStorage.removeItem(fusionKey);
      }
    }
    
    // If it's a new day, reset the tutorial shown flags
    if (lastPlayedDate !== todayDate) {
      localStorage.removeItem('fusdle_normal_tutorial_shown');
      localStorage.removeItem('fusdle_hard_tutorial_shown');
      localStorage.setItem('fusdle_last_played_date', todayDate);
      
      set({
        gameStatus: 'playing',
        attempts: 0,
        revealedHints: [],
        hintsUsedAtAttempts: [],
        previousGuesses: [],
        currentGuess: '',
        partialMatchFeedback: null,
        matchedWord: null,
        matchType: null,
        hasCorrectWordsWrongOrder: false,
        hasGuessedOnce: false,
        showNormalModeTutorial: true,
        showHardModeTutorial: true,
        error: null
      });
    } else {
      set({
        gameStatus: 'playing',
        attempts: 0,
        revealedHints: [],
        hintsUsedAtAttempts: [],
        previousGuesses: [],
        currentGuess: '',
        partialMatchFeedback: null,
        matchedWord: null,
        matchType: null,
        hasCorrectWordsWrongOrder: false,
        hasGuessedOnce: false,
        error: null
      });
    }
  },
  
  // Development-only reset function to clear localStorage completion status
  resetForDevelopment: () => {
    const { puzzle, difficultyMode } = get();
    
    if (puzzle) {
      // Remove this puzzle from the completed puzzles in localStorage with difficulty
      const completedPuzzles = getPuzzleAttemptsData();
      const key = `${puzzle.id}_${difficultyMode}`;
      if (key in completedPuzzles) {
        delete completedPuzzles[key];
        localStorage.setItem('completedPuzzles', JSON.stringify(completedPuzzles));
      }
      
      // Remove all difficulty-specific completion markers
      localStorage.removeItem(`fusdle_${puzzle.id}_${difficultyMode}_completed`);
      localStorage.removeItem(`fusdle_answer_${puzzle.id}_${difficultyMode}`);
      
      // Clear partial matches for this puzzle
      const storageKey = `fusdle_partial_${puzzle.id}_${difficultyMode}`;
      localStorage.removeItem(storageKey);
      
      // Also clear fusion-specific key if needed
      if (puzzle.isFusionTwist) {
        const fusionKey = `fusdle_partial_fusion_${puzzle.puzzleNumber}`;
        localStorage.removeItem(fusionKey);
      }
      
      // Reset the game state
      set({
        gameStatus: 'playing',
        attempts: 0,
        revealedHints: [],
        hintsUsedAtAttempts: [],
        previousGuesses: [],
        currentGuess: '',
        hasCompleted: false,
        partialMatchFeedback: null,
        matchedWord: null,
        matchType: null,
        hasCorrectWordsWrongOrder: false,
        hasGuessedOnce: false,
        error: null
      });
      
      console.log(`Development: ${difficultyMode} puzzle reset, you can play again`);
    }
  },
  
  // Development-only function to fetch a random puzzle from the archive
  // Can specify puzzle type as 'normal', 'hard', or 'fusion'
  fetchRandomPuzzle: async (puzzleType?: string) => {
    set({ loading: true, error: null });
    try {
      // For development purposes, let's create some sample puzzles of different types
      const samplePuzzles = {
        normal: [
          { 
            id: 100, 
            puzzleNumber: 100, 
            date: new Date().toISOString().split('T')[0], 
            emojis: ['🧠', '⛈️'], 
            answer: 'brainstorm', 
            hints: ['Think together', 'Mental weather', 'Idea generation'],
            difficulty: 'normal',
            isFusionTwist: 0,
            twistType: null
          },
          { 
            id: 101, 
            puzzleNumber: 101, 
            date: new Date().toISOString().split('T')[0], 
            emojis: ['🌊', '🏄'], 
            answer: 'wavesurfer', 
            hints: ['Ocean rider', 'Crest glider', 'Water sport'],
            difficulty: 'normal',
            isFusionTwist: 0,
            twistType: null
          }
        ],
        hard: [
          { 
            id: 200, 
            puzzleNumber: 200, 
            date: new Date().toISOString().split('T')[0], 
            emojis: ['🌪️', '😴', '🧿'], 
            answer: 'dreamcatcher', 
            hints: ['Sleep guardian', 'Nightmare filter', 'Bedside hanger'],
            difficulty: 'hard',
            isFusionTwist: 0,
            twistType: null
          },
          { 
            id: 201, 
            puzzleNumber: 201, 
            date: new Date().toISOString().split('T')[0], 
            emojis: ['🍯', '🐻', '🌲'], 
            answer: 'honeyforest', 
            hints: ['Sweet woods', 'Bear\'s paradise', 'Sticky wilderness'],
            difficulty: 'hard',
            isFusionTwist: 0,
            twistType: null
          }
        ],
        fusion: [
          { 
            id: 300, 
            puzzleNumber: 300, 
            date: new Date().toISOString().split('T')[0], 
            emojis: ['🐯', '🦁', '❄️'], 
            answer: 'liontiger', 
            hints: ['Hybrid cat', 'Mixed predator', 'Big feline blend'],
            difficulty: 'normal',
            isFusionTwist: 1,
            twistType: 'Animal Fusion'
          },
          { 
            id: 301, 
            puzzleNumber: 301, 
            date: new Date().toISOString().split('T')[0], 
            emojis: ['🍫', '🥜', '🧈'], 
            answer: 'peanutbuttercup', 
            hints: ['Sweet nutty treat', 'Chocolate disk', 'Reese\'s product'],
            difficulty: 'normal',
            isFusionTwist: 1,
            twistType: 'Food Fusion'
          }
        ]
      };
      
      // Select which array to use based on puzzleType
      const puzzleArray = puzzleType === 'hard' 
        ? samplePuzzles.hard 
        : (puzzleType === 'fusion' 
          ? samplePuzzles.fusion 
          : samplePuzzles.normal);
      
      // Select a random puzzle from the appropriate array
      const randomIndex = Math.floor(Math.random() * puzzleArray.length);
      const randomPuzzle = puzzleArray[randomIndex];
      
      // Reset game state for the new puzzle
      set({
        puzzle: randomPuzzle,
        loading: false,
        gameStatus: 'playing',
        attempts: 0,
        revealedHints: [],
        hintsUsedAtAttempts: [],
        previousGuesses: [],
        currentGuess: '',
        hasCompleted: false,
        partialMatchFeedback: null,
        matchedWord: null,
        matchType: null,
        hasCorrectWordsWrongOrder: false,
        hasGuessedOnce: false,
        // Update difficulty mode based on puzzle difficulty
        difficultyMode: randomPuzzle.difficulty as 'normal' | 'hard',
        // Hard mode is always unlocked in development mode
        hardModeUnlocked: true
      });
      
      console.log(`Development: Loaded ${puzzleType || 'random'} puzzle #${randomPuzzle.puzzleNumber}`);
      if (randomPuzzle.isFusionTwist) {
        console.log(`This is a fusion twist puzzle: ${randomPuzzle.twistType}`);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },
  
  shareResult: () => {
    const { 
      puzzle, 
      gameStatus, 
      attempts, 
      revealedHints, 
      hintsUsedAtAttempts, 
      flawlessStreak, 
      streak, 
      difficultyMode,
      partialMatchFeedback 
    } = get();
    if (!puzzle) return '';
    
    const hintsUsed = revealedHints.length;
    let partialMatches = []; // Array to store attempts with partial matches
    
    // For shareability, we need a persistent way to track partial matches across attempts
    // This is stored in localStorage to persist across page reloads
    const storageKey = `fusdle_partial_${puzzle.id}_${difficultyMode}`;
    
    try {
      const storedPartialMatches = localStorage.getItem(storageKey);
      if (storedPartialMatches) {
        partialMatches = JSON.parse(storedPartialMatches);
      }
    } catch (e) {
      console.error('Error retrieving partial matches from localStorage', e);
    }
    
    // Make sure partialMatches is an array
    if (!Array.isArray(partialMatches)) {
      partialMatches = [];
    }
    
    // Get partial matches data from other sources if needed (same as before)
    // (keeping this logic from the original implementation)
    if (partialMatches.length === 0) {
      try {
        // Check other difficulty modes
        const possibleKeys = [
          `fusdle_partial_${puzzle.id}_normal`,
          `fusdle_partial_${puzzle.id}_hard`,
          `fusdle_partial_${puzzle.id}_fusion`
        ];
        
        for (const key of possibleKeys) {
          if (key !== storageKey) {
            const otherModeMatches = localStorage.getItem(key);
            if (otherModeMatches) {
              partialMatches = JSON.parse(otherModeMatches);
              if (partialMatches.length > 0) {
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error('Error retrieving other difficulty partial matches', e);
      }
    }
    
    // Special handling for fusion puzzles
    if (puzzle.isFusionTwist && partialMatches.length === 0) {
      try {
        const fusionKey = `fusdle_partial_fusion_${puzzle.puzzleNumber}`;
        const fusionMatches = localStorage.getItem(fusionKey);
        if (fusionMatches) {
          partialMatches = JSON.parse(fusionMatches);
        }
      } catch (e) {
        console.error('Error retrieving fusion partial matches', e);
      }
    }
    
    // Build share text as an array of lines for better platform compatibility
    const resultLines = [];
    
    // Use the puzzle's date for Fusdle numbering to stay consistent with the actual puzzle being played
    const puzzleDay = calculateFusdleNumber(puzzle.date, puzzle.puzzleNumber);
      
    let headerLine = `Fusdle #${puzzleDay}`;
    
    if (gameStatus === 'won') {
      headerLine += ` - Solved in ${attempts}`;
    } else if (gameStatus === 'gave_up') {
      headerLine += ` - Gave up after ${attempts}`;
    } else {
      headerLine += ` - Failed after ${attempts}`;
    }
    resultLines.push(headerLine);
    
    // We'll use simple text codes for emojis to avoid encoding issues
    // and then replace them with actual emojis at the end
    let attemptsEmojis = '';
    
    // Generate emojis based on game result and attempts
    for (let i = 0; i < attempts; i++) {
      // Last attempt handling
      if (i === attempts - 1) {
        if (gameStatus === 'won') {
          // Last attempt was correct (green)
          attemptsEmojis += 'GREEN'; // 🟩
        } else if (gameStatus === 'gave_up') {
          // Gave up (X)
          attemptsEmojis += 'X'; // ❌
        } else {
          // Last attempt was wrong (black)
          attemptsEmojis += 'BLACK'; // ⬛
        }
      } 
      // Handle previous attempts
      else if (partialMatches.includes(i)) {
        // Yellow for partial matches (only if actually has a partial match)
        attemptsEmojis += 'YELLOW'; // 🟨
      } else {
        // Wrong attempt (black)
        attemptsEmojis += 'BLACK'; // ⬛
      }
      
      // Debug logging to track partial matches for troubleshooting
      console.log(`Attempt ${i}: Partial Match: ${partialMatches.includes(i)}, PartialMatches: [${partialMatches.join(', ')}]`);
    }
    
    // Convert the text codes back to emojis
    let emojiString = '';
    const emojiCodes = attemptsEmojis.match(/(FIRE|GREEN|YELLOW|BLACK|WHITE|X)/g) || [];
    
    emojiCodes.forEach(code => {
      switch(code) {
        case 'FIRE':
          emojiString += '🔥';
          break;
        case 'GREEN':
          emojiString += '🟩';
          break;
        case 'YELLOW':
          emojiString += '🟨';
          break;
        case 'BLACK':
          emojiString += '⬛';
          break;
        case 'WHITE':
          emojiString += '⬜';
          break;
        case 'X':
          emojiString += '❌';
          break;
        default:
          emojiString += '⬛'; // Default to black square
      }
    });
    
    // Add the emoji string as a single line
    resultLines.push(emojiString);
    
    // Add difficulty mode with appropriate emoji
    if (puzzle.difficulty === 'hard') {
      resultLines.push('💀 Hard Mode');
    } else {
      resultLines.push('🎯 Normal Mode');
    }
    
    // Add hints used info and flawless streak if applicable
    resultLines.push(`Hints used: ${hintsUsed}/${puzzle.hints?.length || 3}`);
    
    // Add flawless streak info if the player has one and didn't use hints
    const currentFlawlessStreak = getFlawlessStreak();
    if (currentFlawlessStreak > 0 && hintsUsed === 0 && gameStatus === 'won') {
      resultLines.push(`✨ Flawless streak: ${currentFlawlessStreak}`);
    }
    
    // Add URL at the end
    resultLines.push('Play at: fusdle.com');
    
    // Join all lines with standard line breaks
    const result = resultLines.join('\n');
    
    return result;
  }
}));
