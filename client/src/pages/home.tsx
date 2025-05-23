import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import GameCard from "@/components/game-card";
import ResultsCard from "@/components/results-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { navigationState } from "@/lib/queryClient";

const Home: React.FC = () => {
  const { 
    fetchTodaysPuzzle, 
    fetchPuzzleByDifficulty,
    gameStatus, 
    puzzle, 
    loading, 
    error, 
    difficultyMode, 
    hardModeUnlocked,
    toggleDifficultyMode,
    streak,
    flawlessStreak
  } = useGameStore();

  // Set up local state to track if normal mode has been attempted
  const [normalAttempted, setNormalAttempted] = useState(false);

  useEffect(() => {
    // Initial load of today's puzzle (normal mode) - only on first render
    fetchPuzzleByDifficulty('normal');
  }, [fetchPuzzleByDifficulty]); // Empty dependency array to run only once
  
  // Separate effect to check if hard mode should be unlocked
  useEffect(() => {
    // Only check when puzzle is loaded and only once
    if (puzzle && puzzle.difficulty === 'normal') {
      const isCompleted = localStorage.getItem(`fusdle_${puzzle.id}_completed`) === 'true';
      if (isCompleted && !normalAttempted) {
        setNormalAttempted(true);
        // Set hard mode as unlocked in the store
        useGameStore.setState({ hardModeUnlocked: true });
      }
    }
  }, [puzzle, normalAttempted]);

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <div className="text-center">
          <div className="text-4xl mb-4 text-destructive">😕</div>
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            className="bg-secondary text-white py-2 px-4 rounded-lg"
            onClick={() => fetchTodaysPuzzle()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && !puzzle) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <div className="text-center">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-lg">Loading today's puzzle...</p>
        </div>
      </div>
    );
  }

  // Check for fusion twist to display badge
  const hasFusionTwist = puzzle?.isFusionTwist === 1;
  
  return (
    <>
      {/* Streak and fusion twist indicators */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        {/* Left side - Streak indicators */}
        <div className="flex items-center space-x-2">
          {streak >= 3 && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
              <span>🔥</span>
              <span>{streak}-Day Streak</span>
            </div>
          )}
          

        </div>
        
        {/* Right side - Streak display (kept the same) */}
        <div className="flex items-center"></div>
      </div>
      
      {/* Centered Fusion twist indicator - More prominent position */}
      {hasFusionTwist && (
        <div className="flex justify-center items-center mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-lg shadow-md text-center font-medium flex items-center gap-3 animate-pulse transform hover:scale-105 transition-transform cursor-default">
            <span className="animate-spin-slow text-xl">🌀</span>
            <span className="text-md font-bold">{puzzle?.twistType || 'Fusion Twist'} puzzle active today!</span>
            <span className="animate-spin-slow text-xl">🌀</span>
          </div>
        </div>
      )}
      
      {/* Difficulty mode tabs */}
      <Tabs 
        defaultValue="normal" 
        className="mb-6"
        onValueChange={(value) => {
          // When tab value changes, fetch the appropriate puzzle
          if (value === 'normal') {
            fetchPuzzleByDifficulty('normal');
          } else if (value === 'hard' && hardModeUnlocked) {
            fetchPuzzleByDifficulty('hard');
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            value="normal"
            className="flex items-center justify-center space-x-2"
          >
            <span>🔥</span>
            <span>Normal Puzzle</span>
          </TabsTrigger>
          <TabsTrigger 
            value="hard"
            disabled={!hardModeUnlocked}
            className="flex items-center justify-center space-x-2"
          >
            <span>💀</span>
            <span>Hard Puzzle</span>
            {!hardModeUnlocked && (
              <span className="ml-1 text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                Locked
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="normal" className="space-y-4">
          <GameCard />
          {difficultyMode === 'normal' && gameStatus !== 'playing' && <ResultsCard />}
        </TabsContent>
        
        <TabsContent value="hard" className="space-y-4">
          {hardModeUnlocked ? (
            <>
              <GameCard />
              {difficultyMode === 'hard' && gameStatus !== 'playing' && <ResultsCard />}
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
              <div className="text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h2 className="text-xl font-bold mb-2">Hard Mode Locked</h2>
                <p className="text-gray-600 mb-4">
                  Complete today's Normal puzzle first to unlock Hard mode!
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Home;
