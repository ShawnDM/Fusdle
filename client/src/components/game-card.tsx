import React, { useState, FormEvent, useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import EmojiDisplay from "@/components/emoji-display";
import Hints from "@/components/hints";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Skull, Flame, HelpCircle, X } from "lucide-react";
import { confirmAlert } from 'react-confirm-alert';
import { useToast } from "@/hooks/use-toast";
import { calculateFusdleNumber } from "@/lib/utils";
import { resetFlawlessStreak } from "@/lib/streak";
import 'react-confirm-alert/src/react-confirm-alert.css';
import '@/components/confirm-dialog.css';

const GameCard: React.FC = () => {
  const {
    puzzle,
    attempts,
    revealedHints,
    streak,
    flawlessStreak,
    currentGuess,
    setCurrentGuess,
    submitGuess,
    revealHint,
    giveUp,
    gameStatus,
    hasCompleted,
    hasGuessedOnce,
    checkCompletedStatus,
    resetForDevelopment,
    fetchRandomPuzzle,
    difficultyMode,
    hardModeUnlocked,
    toggleDifficultyMode,
    partialMatchFeedback,
    showNormalModeTutorial,
    showHardModeTutorial,
    dismissTutorial
  } = useGameStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast(); // Initialize toast hook at component top level
  
  // Check if the puzzle has already been completed when the component loads
  useEffect(() => {
    if (puzzle) {
      checkCompletedStatus();
    }
  }, [puzzle?.id]);
  
  // Automatically focus the input after submission
  useEffect(() => {
    if (!isSubmitting && gameStatus === 'playing') {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isSubmitting, gameStatus]);

  if (!puzzle) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in flex justify-center items-center min-h-[480px]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg">Loading today's puzzle...</p>
        </div>
      </div>
    );
  }

  // Handle revealing a hint with confirmation for both modes to warn about flawless streak
  const handleRevealHint = async () => {
    // Check if we can use a hint (1 per guess)
    const totalAvailableHints = puzzle?.hints?.length || 3;
    const hintsRemaining = totalAvailableHints - revealedHints.length;
    const canUseHint = hintsRemaining > 0 && (attempts > revealedHints.length);
    
    if (!canUseHint) {
      if (hintsRemaining <= 0) {
        toast({
          title: "No more hints available",
          description: "You've used all available hints for this puzzle.",
          variant: "destructive"
        });
      } else if (attempts <= revealedHints.length) {
        toast({
          title: "One hint per guess",
          description: "Make another guess to unlock your next hint.",
          variant: "default"
        });
      }
      return;
    }
    
    // Show warning for all difficulty modes if flawless streak > 0
    if (flawlessStreak > 0) {
      confirmAlert({
        title: 'Your flawless streak is at risk!',
        message: `You currently have a flawless streak of ${flawlessStreak}. Using a hint will reset your flawless streak to zero. Are you sure you want to continue?`,
        buttons: [
          {
            label: 'No, I\'ll solve it myself',
            onClick: () => console.log('Hint declined, flawless streak preserved')
          },
          {
            label: 'Yes, show me the hint',
            onClick: async () => {
              // Reset flawless streak immediately for instant UI feedback
              resetFlawlessStreak();
              useGameStore.setState({ flawlessStreak: 0 });
              
              // Then get the hint
              await revealHint();
            }
          }
        ]
      });
    } 
    // If no flawless streak but in hard mode, still show warning
    else if (difficultyMode === 'hard') {
      confirmAlert({
        title: 'Do you want a hint?',
        message: 'In Hard Mode, hints aren\'t free! Using hints will make your solve less impressive.',
        buttons: [
          {
            label: 'No, I\'ll solve it myself',
            onClick: () => console.log('Hint declined')
          },
          {
            label: 'Yes, show me the hint',
            onClick: async () => {
              // Reset flawless streak if it exists, just to be safe
              if (flawlessStreak > 0) {
                resetFlawlessStreak();
                useGameStore.setState({ flawlessStreak: 0 });
              }
              await revealHint();
            }
          }
        ]
      });
    } else {
      // In normal mode with no flawless streak, reveal the hint immediately
      await revealHint();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentGuess.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitGuess(currentGuess.trim());
      setCurrentGuess("");
      // No automatic hint showing after wrong guess
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate how many hints are remaining
  const totalAvailableHints = puzzle?.hints?.length || 3;
  const hintsRemaining = totalAvailableHints - revealedHints.length;
  const canUseHint = hintsRemaining > 0 && (attempts > revealedHints.length); // 1 hint per guess rule

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Normal Mode Tutorial Popup */}
      {showNormalModeTutorial && difficultyMode === 'normal' && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Flame className="w-5 h-5 mr-2 text-secondary" /> Normal Mode
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => dismissTutorial('normal')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <p>Welcome to <strong>Fusdle</strong>! In this game, you'll guess words or phrases that combine the concepts shown by the emojis.</p>
              <p>In <strong>Normal Mode</strong>:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You have unlimited attempts to guess the answer</li>
                <li>You can request hints after each guess</li>
                <li>The word count is shown to help you</li>
                <li>Completing today's puzzle unlocks Hard Mode</li>
              </ul>
              <p className="text-secondary font-medium">Make your first guess to begin!</p>
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => dismissTutorial('normal')}>
              Play
            </Button>
          </div>
        </div>
      )}
      
      {/* Hard Mode Tutorial Popup */}
      {showHardModeTutorial && difficultyMode === 'hard' && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Skull className="w-5 h-5 mr-2 text-destructive" /> Hard Mode
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => dismissTutorial('hard')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <p>You've unlocked <strong>Hard Mode</strong>! This is a more challenging version of Fusdle with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>More difficult puzzles</li>
                <li>More emojis in each puzzle</li>
                <li>Hints will affect your flawless streak</li>
                <li>Solve without hints for a perfect score!</li>
              </ul>
              <p className="text-destructive font-medium">Good luck - you'll need it!</p>
            </div>
            <Button 
              variant="destructive"
              className="w-full mt-4" 
              onClick={() => dismissTutorial('hard')}>
              Play Hard Mode
            </Button>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {/* Using today's date for Fusdle number, not fallback puzzle date */}
          <span>Fusdle #{calculateFusdleNumber(new Date().toISOString().split('T')[0], undefined)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-secondary/10 rounded-full px-3 py-1">
            <span className="text-sm font-medium text-secondary">
              🔥 Streak: <span>{streak}</span>
            </span>
          </div>
          <div className="flex items-center bg-amber-100 rounded-full px-3 py-1">
            <span className="text-sm font-medium text-amber-700">
              ✨ Flawless: <span>{flawlessStreak}</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Difficulty indicator with smooth animations */}
      <div className="flex justify-between items-center mb-4">
        <motion.div
          key={`difficulty-badge-${difficultyMode}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
          <Badge 
            variant={difficultyMode === 'hard' ? 'destructive' : 'secondary'}
            className="text-xs py-1 pl-1.5 pr-2 flex items-center gap-1 transition-colors duration-300"
          >
            {difficultyMode === 'hard' ? (
              <motion.span className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Skull className="h-3 w-3" /> Hard Mode
              </motion.span>
            ) : (
              <motion.span className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Flame className="h-3 w-3" /> Normal Mode
              </motion.span>
            )}
          </Badge>
        </motion.div>
        
        {/* Difficulty mode toggle button removed as requested */}
      </div>

      <EmojiDisplay emojis={puzzle.emojis} />

      {/* Word count hint */}
      {puzzle.wordCount && (
        <div className="flex items-center justify-center my-2 text-sm text-gray-500">
          <span className="mr-1">🧠</span>
          <span className="font-medium">{puzzle.wordCount} {puzzle.wordCount === 1 ? 'word' : 'words'}</span>
        </div>
      )}

      {/* Input form area with fixed height */}
      <div className="min-h-[90px]">
        {gameStatus === 'playing' && !hasCompleted && (
          <motion.form 
            className="mb-6" 
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex">
              <input
                ref={inputRef}
                type="text"
                className="flex-grow rounded-l-lg border-0 p-3 text-lg focus:ring-2 focus:ring-secondary"
                placeholder="Enter your guess"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                autoComplete="off"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className={`bg-secondary text-white rounded-r-lg px-4 font-medium transition ${
                  isSubmitting ? "opacity-70" : "hover:bg-secondary/90"
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "..." : "Guess"}
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {gameStatus === 'playing' && !hasCompleted ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              <span>{attempts}</span> {attempts === 1 ? 'guess' : 'guesses'} made
            </div>
            
            <div className="flex space-x-2">
              {/* Give Up button - only shows after making at least one guess */}
              {hasGuessedOnce && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    confirmAlert({
                      title: 'Are you sure?',
                      message: 'Giving up will end the game and reveal the answer. Your streak will be lost.',
                      buttons: [
                        {
                          label: 'No, keep trying',
                          onClick: () => {}
                        },
                        {
                          label: 'Yes, give up',
                          onClick: () => giveUp()
                        }
                      ]
                    });
                  }}
                  className="text-xs flex items-center gap-1"
                >
                  <span className="text-xs">⚠️</span> Give Up
                </Button>
              )}
              
              {/* Hint button - disabled if no hints remaining or not enough guesses */}
              {attempts > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRevealHint}
                  disabled={!canUseHint}
                  className="text-xs flex items-center gap-1"
                  title={!canUseHint ? 
                    (hintsRemaining <= 0 ? 
                      "No more hints available" : 
                      "Make another guess to unlock a hint") : 
                    "Reveal a hint"
                  }
                >
                  <span className="text-xs">💡</span> 
                  {difficultyMode === 'hard' ? 'Request Hint' : 'Get Hint'}
                  <span className="ml-1 opacity-75">({hintsRemaining})</span>
                </Button>
              )}
              
              {/* Help button to show tutorial again with smoother animation */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // For the normal mode, just manually set the tutorial flag
                    if (difficultyMode === 'normal') {
                      useGameStore.setState({ showNormalModeTutorial: true });
                    } else {
                      useGameStore.setState({ showHardModeTutorial: true });
                    }
                  }}
                  className="text-xs flex items-center gap-1 transition-all duration-200"
                  title="Show tutorial again"
                >
                  <HelpCircle className="h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </div>

          <Hints hints={revealedHints} />
          
          {/* Partial match feedback */}
          {partialMatchFeedback && (
            <div className="mt-2 mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-800">
              <div className="flex items-center">
                <span className="mr-2">✨</span>
                <p className="text-sm font-medium">{partialMatchFeedback}</p>
              </div>
            </div>
          )}
          
          {/* Development-only buttons - visible while playing (in dev mode only) */}
          {import.meta.env.DEV && (
            <div className="flex justify-center space-x-2 mt-4 border-t pt-3 border-gray-100">
              <button
                onClick={() => fetchRandomPuzzle()}
                className="bg-purple-700 text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Load a random puzzle"
              >
                🎲 RANDOMIZE
              </button>
              
              {/* Special button to test fusion twist puzzles */}
              <button
                onClick={() => fetchRandomPuzzle('fusion')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Test fusion twist puzzle"
              >
                🌀 TEST FUSION
              </button>
              
              {/* Button to test hard puzzles */}
              <button
                onClick={() => fetchRandomPuzzle('hard')}
                className="bg-red-800 text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Test hard puzzle"
              >
                💀 TEST HARD
              </button>
            </div>
          )}
        </>
      ) : hasCompleted && gameStatus === 'playing' ? (
        <div className="p-4 bg-neutral/50 rounded-lg text-center my-4">
          <p className="text-lg font-medium">You've already completed this Fusdle.</p>
          <p className="text-sm text-gray-500 mt-1">Check back tomorrow for a new challenge!</p>
          
          {/* Development-only buttons - will be hidden in production */}
          {import.meta.env.DEV && (
            <div className="flex justify-center space-x-2 mt-3">
              <button
                onClick={() => resetForDevelopment()}
                className="bg-black text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Reset puzzle for testing"
              >
                🛠️ DEV RESET
              </button>
              <button
                onClick={() => fetchRandomPuzzle()}
                className="bg-purple-700 text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Load a random puzzle"
              >
                🎲 RANDOMIZE
              </button>
              
              {/* Special button to test fusion twist puzzles */}
              <button
                onClick={() => fetchRandomPuzzle('fusion')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Test fusion twist puzzle"
              >
                🌀 TEST FUSION
              </button>
              
              {/* Button to test hard puzzles */}
              <button
                onClick={() => fetchRandomPuzzle('hard')}
                className="bg-red-800 text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Test hard puzzle"
              >
                💀 TEST HARD
              </button>
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
};

export default GameCard;