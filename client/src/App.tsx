import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Archive from "@/pages/archive";
import About from "@/pages/about";
import PatchNotes from "@/pages/patch-notes";
import NavTabs from "@/components/nav-tabs";
import SocialButtons from "@/components/social-buttons";
import { navigationState, updateNavigationState, queryClient } from "@/lib/queryClient";
import { firestoreService } from "@/firebase/firestore";
import { getApiBaseUrl } from "@/lib/queryClient";
import { getGlobalDateString, shouldShowNewPuzzle } from "@/lib/global-time";

function App() {
  const [location, setLocation] = useLocation();
  const fetchTodaysPuzzle = useGameStore(state => state.fetchTodaysPuzzle);
  const fetchPuzzleByDifficulty = useGameStore(state => state.fetchPuzzleByDifficulty);
  const difficultyMode = useGameStore(state => state.difficultyMode);
  const [currentDay, setCurrentDay] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const preloadedRef = useRef<boolean>(false);
  
  // Function to get current date in EST timezone
  const getCurrentEstDate = (): string => {
    const options = { timeZone: 'America/New_York' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Preload archive data for faster navigation
  const preloadArchiveData = useCallback(async () => {
    if (navigationState.archiveLoaded) return;
    
    try {
      console.log("Preloading archive data for smoother navigation...");
      // Try Firebase service first
      let archiveData = null;
      
      try {
        const puzzlesByDifficulty = await firestoreService.getPuzzlesByDifficulty('normal', 8);
        if (puzzlesByDifficulty && puzzlesByDifficulty.length > 0) {
          archiveData = puzzlesByDifficulty;
        }
      } catch (error) {
        console.warn("Firebase archive fetch failed, trying API:", error);
      }
      
      // Fallback to API
      if (!archiveData) {
        const archiveResponse = await fetch(`${getApiBaseUrl()}/api/puzzles/archive`);
        if (archiveResponse.ok) {
          archiveData = await archiveResponse.json();
        }
      }
      
      if (archiveData) {
        // Cache in the navigation state
        updateNavigationState({ 
          archiveLoaded: true,
          archiveData: archiveData
        });
        
        // Also cache in React Query for component reuse
        queryClient.setQueryData(['/api/puzzles/archive'], archiveData);
        
        console.log("Archive data preloaded successfully");
      }
    } catch (error) {
      console.error("Failed to preload archive data:", error);
    }
  }, []);
  
  // Preload the other difficulty mode but don't display it
  const preloadOtherDifficultyMode = useCallback(async () => {
    if (isPreloading) return;
    
    try {
      setIsPreloading(true);
      const otherMode = difficultyMode === 'normal' ? 'hard' : 'normal';
      console.log(`Preloading ${otherMode} difficulty puzzle for future use only...`);
      
      // Don't load the actual puzzle through the game store (which could switch modes)
      // Instead make a direct API call to preload into cache
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || ''}/api/puzzles/today?difficulty=${otherMode}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`${otherMode} difficulty puzzle preloaded to cache successfully`);
          
          // Just store in cache without affecting current display
          useGameStore.setState(state => ({
            cachedPuzzles: {
              ...state.cachedPuzzles,
              [otherMode]: data
            }
          }));
        }
      } catch (err) {
        console.error("Failed to preload puzzle data:", err);
      }
    } catch (error) {
      console.error("Failed to preload other difficulty mode:", error);
    } finally {
      setIsPreloading(false);
    }
  }, [difficultyMode, isPreloading]);
  
  // Track page transitions and maintain game state
  useEffect(() => {
    // Cache current game state before navigating away from home
    const previousLocation = navigationState.lastPageVisited;
    if (previousLocation === '/' && location !== '/') {
      // We're navigating away from the home page, save the game state
      console.log('Navigating away from home, caching game state');
      
      // Save the current state to both cache and localStorage for persistence
      useGameStore.getState().cacheCurrentGameState();
      
      // Also save to localStorage for guaranteed persistence
      const currentState = useGameStore.getState();
      if (currentState.puzzle) {
        const gameStateKey = `fusdle_game_state_${currentState.puzzle.id}_${currentState.difficultyMode}`;
        try {
          const stateToSave = {
            attempts: currentState.attempts,
            revealedHints: currentState.revealedHints,
            hintsUsedAtAttempts: currentState.hintsUsedAtAttempts,
            previousGuesses: currentState.previousGuesses,
            gameStatus: currentState.gameStatus,
            hasCompleted: currentState.hasCompleted,
            hasGuessedOnce: currentState.hasGuessedOnce,
            partialMatchFeedback: currentState.partialMatchFeedback,
          };
          
          localStorage.setItem(gameStateKey, JSON.stringify(stateToSave));
          console.log('Game state persisted to localStorage for later restoration');
        } catch (error) {
          console.error('Error persisting game state to localStorage:', error);
        }
      }
    }
    
    // Update last visited page in navigation state
    updateNavigationState({ lastPageVisited: location });
    
    // Preload related data based on current page
    if (location === '/') {
      // If we're returning to home page, check if we need to restore cached state
      if (previousLocation !== '/' && navigationState.initialPuzzleLoaded) {
        console.log('Returning to home, restoring cached game state');
        const currentMode = useGameStore.getState().difficultyMode;
        
        // First try to load from cache (memory)
        const cacheLoaded = useGameStore.getState().loadGameStateFromCache(currentMode) || false;
        
        // If cache loading failed, try to load from localStorage
        if (!cacheLoaded) {
          console.log('Cache load failed, trying localStorage...');
          
          // This will trigger our localStorage loading logic
          // We'll let checkCompletedStatus handle restoring from localStorage
          const puzzleId = useGameStore.getState().puzzle?.id;
          if (puzzleId) {
            setTimeout(() => {
              useGameStore.getState().checkCompletedStatus();
            }, 100);
          } else {
            // If we don't have a puzzle ID, fetch a fresh puzzle
            fetchPuzzleByDifficulty(currentMode);
          }
        }
      }
      
      // On the home page, preload archive data and other difficulty in the background
      if (!navigationState.archiveLoaded) {
        setTimeout(() => preloadArchiveData(), 2000); // Delay to not compete with initial puzzle load
      }
      
      // Preload the other difficulty mode after the current mode is loaded
      if (navigationState.initialPuzzleLoaded && !preloadedRef.current) {
        setTimeout(() => {
          preloadOtherDifficultyMode();
          preloadedRef.current = true;
        }, 3000);
      }
    }
  }, [location, preloadArchiveData, preloadOtherDifficultyMode, fetchPuzzleByDifficulty]);
  
  // Check for a new day (midnight EST) and reset/fetch puzzles accordingly
  // Uses global time API to prevent users from manipulating device clock
  useEffect(() => {
    // Initial load of puzzle with global time
    const initializePuzzles = async () => {
      try {
        // Get the global date string (based on server time)
        const globalDateStr = await getGlobalDateString();
        console.log('Global date for initial puzzle load:', globalDateStr);
        setCurrentDay(globalDateStr);
        
        // Fetch today's puzzle using global time
        await fetchTodaysPuzzle();
        
        // Mark initial puzzle as loaded
        updateNavigationState({ initialPuzzleLoaded: true });
      } catch (error) {
        console.error('Error initializing puzzles with global time:', error);
      }
    };
    
    initializePuzzles();
    
    // Set up an interval to check for date changes (every minute)
    const intervalId = setInterval(async () => {
      try {
        // Get current date from the last puzzle load
        const lastPuzzleDate = currentDay;
        if (!lastPuzzleDate) return;
        
        // Check if we should show a new puzzle (crossed midnight EST)
        const shouldRefresh = await shouldShowNewPuzzle(lastPuzzleDate);
        
        if (shouldRefresh) {
          // Get the new global date
          const newGlobalDate = await getGlobalDateString();
          console.log('New day detected (midnight EST passed), refreshing puzzles');
          console.log(`Date changed from ${lastPuzzleDate} to ${newGlobalDate}`);
          
          // Update state with the new date
          setCurrentDay(newGlobalDate);
          
          // Reset all game state before fetching the new puzzle
          useGameStore.getState().resetGame();
          
          // Fetch the new puzzle
          await fetchTodaysPuzzle();
          
          // Reset the preloaded state to trigger preloading of the other difficulty
          preloadedRef.current = false;
          
          // Alert the user that a new puzzle is available
          alert('It\'s a new day! Today\'s puzzle has been loaded.');
        }
      } catch (error) {
        console.error('Error checking for puzzle refresh:', error);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [currentDay, fetchTodaysPuzzle]);
  
  // This effect makes sure the correct puzzle for the selected difficulty mode is shown 
  // when navigating between pages
  useEffect(() => {
    // Only run this when returning to the home page
    if (location === '/' && navigationState.initialPuzzleLoaded) {
      // Short delay to allow page transition to complete
      const timer = setTimeout(() => {
        // Verify that the puzzle displayed matches the current difficulty mode
        const currentMode = useGameStore.getState().difficultyMode;
        const currentPuzzle = useGameStore.getState().puzzle;
        
        if (currentPuzzle && currentPuzzle.difficulty !== currentMode) {
          console.log(`Detected mismatch: Showing ${currentPuzzle.difficulty} puzzle when in ${currentMode} mode. Fixing...`);
          
          // Fetch the correct puzzle for the current difficulty
          fetchPuzzleByDifficulty(currentMode);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [location, fetchPuzzleByDifficulty]);
  
  // Function to manually check for new puzzles - simplified and more robust
  const checkForNewPuzzle = async () => {
    try {
      const lastPuzzleDate = currentDay;
      
      // Get today's date using our reliable local method
      const todayDate = await getGlobalDateString();
      console.log(`Current date check - Last puzzle: ${lastPuzzleDate}, Today: ${todayDate}`);
      
      // First, do a direct date comparison in case the state is out of sync
      if (lastPuzzleDate !== todayDate) {
        console.log(`Direct date mismatch - updating from ${lastPuzzleDate} to ${todayDate}`);
        
        // Update state with today's date
        setCurrentDay(todayDate);
        
        // Reset game state
        useGameStore.getState().resetGame();
        
        // Fetch the new puzzle
        await fetchTodaysPuzzle();
        
        // Reset the preloaded state to trigger preloading of the other difficulty
        preloadedRef.current = false;
        
        return true;
      }
      
      // If dates match, check using our more detailed implementation
      const shouldRefresh = await shouldShowNewPuzzle(lastPuzzleDate);
      
      if (shouldRefresh) {
        console.log('Time check suggests we need a new puzzle');
        
        // Reset game state
        useGameStore.getState().resetGame();
        
        // Fetch the new puzzle
        await fetchTodaysPuzzle();
        
        // Reset the preloaded state to trigger preloading of the other difficulty
        preloadedRef.current = false;
        
        return true;
      }
      
      console.log('No new puzzle needed - you have the current day');
      return false;
    } catch (error) {
      console.error('Error checking for puzzle refresh:', error);
      return false;
    }
  };
  
  // Add the checkForNewPuzzle function to window to access it from components
  // @ts-ignore
  window.checkForNewPuzzle = checkForNewPuzzle;

  return (
    <TooltipProvider>
      <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-1">Fusdle</h1>
          <p className="text-white/90 text-lg">🔮🧠 Guess the fusion behind the emojis!</p>
        </header>
        
        <NavTabs currentPath={location} />
        
        <div className="flex-grow flex flex-col">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/archive" component={Archive} />
            <Route path="/patch-notes" component={PatchNotes} />
            <Route path="/about" component={About} />
            <Route component={NotFound} />
          </Switch>
        </div>
        
        {/* Social buttons placed before footer */}
        <SocialButtons />
        
        <footer className="py-4 text-center text-white/70 text-sm">
          <p>© {new Date().getFullYear()} Fusdle. All rights reserved.</p>
        </footer>
      </div>
      
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
