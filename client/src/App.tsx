import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Archive from "@/pages/archive";
import About from "@/pages/about";
import NavTabs from "@/components/nav-tabs";
import { navigationState, updateNavigationState, queryClient } from "@/lib/queryClient";
import { firestoreService } from "@/firebase/firestore";
import { getApiBaseUrl } from "@/lib/queryClient";

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
  
  // Preload the other difficulty mode
  const preloadOtherDifficultyMode = useCallback(async () => {
    if (isPreloading) return;
    
    try {
      setIsPreloading(true);
      const otherMode = difficultyMode === 'normal' ? 'hard' : 'normal';
      console.log(`Preloading ${otherMode} difficulty puzzle for faster mode switching...`);
      
      // This will cache the puzzle in the game store
      await fetchPuzzleByDifficulty(otherMode);
      console.log(`${otherMode} difficulty puzzle preloaded successfully`);
    } catch (error) {
      console.error("Failed to preload other difficulty mode:", error);
    } finally {
      setIsPreloading(false);
    }
  }, [difficultyMode, fetchPuzzleByDifficulty, isPreloading]);
  
  // Track page transitions
  useEffect(() => {
    // Update last visited page in navigation state
    updateNavigationState({ lastPageVisited: location });
    
    // Preload related data based on current page
    if (location === '/') {
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
  }, [location, preloadArchiveData, preloadOtherDifficultyMode]);
  
  // Check for a new day (midnight EST) and reset/fetch puzzles accordingly
  useEffect(() => {
    // Set initial date and load initial puzzle
    setCurrentDay(getCurrentEstDate());
    fetchTodaysPuzzle().then(() => {
      // Mark initial puzzle as loaded
      updateNavigationState({ initialPuzzleLoaded: true });
    });
    
    // Set up an interval to check for date changes (every minute)
    const intervalId = setInterval(() => {
      const newDate = getCurrentEstDate();
      
      // If the date has changed, update state and fetch new puzzle
      if (newDate !== currentDay) {
        console.log('New day detected, refreshing puzzles');
        setCurrentDay(newDate);
        fetchTodaysPuzzle();
        // Reset the preloaded state
        preloadedRef.current = false;
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [currentDay, fetchTodaysPuzzle]);
  
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
            <Route path="/about" component={About} />
            <Route component={NotFound} />
          </Switch>
        </div>
        
        <footer className="mt-auto py-4 text-center text-white/70 text-sm">
          <p>© {new Date().getFullYear()} Fusdle. All rights reserved.</p>
        </footer>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
