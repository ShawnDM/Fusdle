import React, { useState, FormEvent, useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import EmojiDisplay from "@/components/emoji-display";
import Hints from "@/components/hints";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Skull, Flame, HelpCircle, X, ChevronDown, RefreshCw } from "lucide-react";
import { confirmAlert } from 'react-confirm-alert';
import { useToast } from "@/hooks/use-toast";
import { calculateFusdleNumber } from "@/lib/utils";
import { resetFlawlessStreak } from "@/lib/streak";
import 'react-confirm-alert/src/react-confirm-alert.css';
import '@/components/confirm-dialog.css';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Helper function to highlight the matching part of the guess - enhanced for production compatibility
const highlightPartialMatch = (guess: string, feedback: string, matchedWord?: string | null): React.ReactNode => {
  console.log('Highlighting partial match (enhanced version):', { guess, feedback, matchedWord });
  
  try {
    // PRIORITY 1: Use server-provided matched word if available
    if (matchedWord) {
      console.log(`Using matched word from server: "${matchedWord}"`);
      // Ensure matchedWord is actually a string and normalize it
      const matchWordRaw = matchedWord.toString().trim();
      const matchWord = matchWordRaw.toLowerCase();
      
      // Split the guess into words for word-level matching
      const words = guess.split(' ');
      
      // Look for an exact word match first
      for (let i = 0; i < words.length; i++) {
        if (words[i].toLowerCase() === matchWord) {
          // Create parts with highlighted match
          const before = i > 0 ? words.slice(0, i).join(' ') + ' ' : '';
          const after = i < words.length - 1 ? ' ' + words.slice(i + 1).join(' ') : '';
          
          return (
            <span>
              {before}
              <span className="text-green-600 bg-green-100 font-semibold px-1 rounded">
                {words[i]}
              </span>
              {after}
            </span>
          );
        }
      }
      
      // Try substring match if word match fails
      const guessLower = guess.toLowerCase();
      const matchIndex = guessLower.indexOf(matchWord);
      console.log(`Substring match: searching for "${matchWord}" in "${guessLower}", found at index ${matchIndex}`);
      
      if (matchIndex >= 0) {
        const before = guess.substring(0, matchIndex);
        const match = guess.substring(matchIndex, matchIndex + matchWord.length);
        const after = guess.substring(matchIndex + matchWord.length);
        console.log(`Highlighting: before="${before}", match="${match}", after="${after}"`);
        
        return (
          <span>
            {before}
            <span className="text-green-600 bg-green-100 font-semibold px-1 rounded">
              {match}
            </span>
            {after}
          </span>
        );
      }
    }
    
    // PRIORITY 2: Extract word from quotes in feedback
    const quotedPattern = /"([^"]+)"/i;
    const quotedMatch = feedback.match(quotedPattern);
    
    if (quotedMatch && quotedMatch[1]) {
      const matchWord = quotedMatch[1].toLowerCase();
      console.log('Found quoted word:', matchWord);
      
      // Split the guess into words
      const words = guess.split(' ');
      
      // Look for an exact match first
      for (let i = 0; i < words.length; i++) {
        if (words[i].toLowerCase() === matchWord) {
          // Create parts with highlighted match
          const before = i > 0 ? words.slice(0, i).join(' ') + ' ' : '';
          const after = i < words.length - 1 ? ' ' + words.slice(i + 1).join(' ') : '';
          
          return (
            <span>
              {before}
              <span className="text-green-600 bg-green-100 font-semibold px-1 rounded">
                {words[i]}
              </span>
              {after}
            </span>
          );
        }
      }
      
      // Try substring match
      const guessLower = guess.toLowerCase();
      const matchIndex = guessLower.indexOf(matchWord);
      
      if (matchIndex >= 0) {
        const before = guess.substring(0, matchIndex);
        const match = guess.substring(matchIndex, matchIndex + matchWord.length);
        const after = guess.substring(matchIndex + matchWord.length);
        
        return (
          <span>
            {before}
            <span className="text-green-600 bg-green-100 font-semibold px-1 rounded">
              {match}
            </span>
            {after}
          </span>
        );
      }
    }
    
    // FALLBACK: Try to intelligently guess which word matched
    // This handles the production case where the server might not provide the matchedWord
    const words = guess.split(' ');
    
    // Sort words by length (prioritize longer words as they're more likely to be significant)
    const significantWords = [...words]
      .filter(word => word.length >= 3)
      .sort((a, b) => b.length - a.length);
      
    if (significantWords.length > 0) {
      const bestGuessWord = significantWords[0];
      const i = words.indexOf(bestGuessWord);
      
      // Highlight this word as our best guess for what matched
      const before = i > 0 ? words.slice(0, i).join(' ') + ' ' : '';
      const after = i < words.length - 1 ? ' ' + words.slice(i + 1).join(' ') : '';
      
      return (
        <span>
          {before}
          <span className="text-green-600 bg-green-100 font-semibold px-1 rounded">
            {words[i]}
          </span>
          {after}
        </span>
      );
    }
    
    // Last resort: just return the original text
    return <span>{guess}</span>;
  } catch (error) {
    console.error('Error in highlightPartialMatch:', error);
    return <span>{guess}</span>;
  }
};

const GameCard: React.FC = () => {
  const {
    puzzle,
    attempts,
    revealedHints,
    hintsUsedAtAttempts,
    previousGuesses,
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
    matchedWord,
    showNormalModeTutorial,
    showHardModeTutorial,
    dismissTutorial
  } = useGameStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFusionDialog, setShowFusionDialog] = useState(false);
  const [currentTwistType, setCurrentTwistType] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast(); // Initialize toast hook at component top level
  
  // Function to show the fusion twist explanation popup
  const showFusionPopup = (twistType: string | undefined | null) => {
    setCurrentTwistType(twistType || "Special");
    setShowFusionDialog(true);
  };
  
  // Show fusion popup automatically when a fusion puzzle is first loaded
  useEffect(() => {
    if (puzzle?.isFusionTwist === 1) {
      // Check if we've shown the popup for this specific puzzle before
      const fusionPopupShownKey = `fusdle_fusion_popup_shown_${puzzle.id}`;
      const hasShownPopup = localStorage.getItem(fusionPopupShownKey);
      
      if (!hasShownPopup) {
        // Show popup after a short delay to ensure UI is ready
        setTimeout(() => {
          showFusionPopup(puzzle.twistType);
          // Mark this fusion popup as shown
          localStorage.setItem(fusionPopupShownKey, 'true');
        }, 600);
      }
    }
  }, [puzzle?.id, puzzle?.isFusionTwist]);
  
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
    
    // Check if we have enough guesses to reveal a hint
    const hasEnoughGuesses = attempts > revealedHints.length;
    
    // Check if the most recent hint was for the current attempt number
    // This prevents getting consecutive hints without making a new guess in between
    const lastHintAttempt = hintsUsedAtAttempts.length > 0 ? 
      hintsUsedAtAttempts[hintsUsedAtAttempts.length - 1] : -1;
    const isConsecutiveHint = lastHintAttempt === attempts;
    
    const canUseHint = hintsRemaining > 0 && hasEnoughGuesses && !isConsecutiveHint;
    
    if (!canUseHint) {
      if (hintsRemaining <= 0) {
        toast({
          title: "No more hints available",
          description: "You've used all available hints for this puzzle.",
          variant: "destructive"
        });
      } else if (!hasEnoughGuesses) {
        toast({
          title: "One hint per guess",
          description: "Make another guess to unlock your next hint.",
          variant: "default"
        });
      } else if (isConsecutiveHint) {
        toast({
          title: "Alternate guesses and hints",
          description: "You must make another guess before using another hint.",
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

  // Function to check for new puzzles with simplified logic (no popup)
  const checkForNewPuzzle = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Call the global checkForNewPuzzle function without any popup notifications
      await (window as any).checkForNewPuzzle();
    } catch (error) {
      console.error('Error checking for new puzzles:', error);
    } finally {
      setIsRefreshing(false);
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
  
  // Check if we have enough guesses to reveal a hint
  const hasEnoughGuesses = attempts > revealedHints.length;
  
  // Check if the most recent hint was for the current attempt number
  // This prevents getting consecutive hints without making a new guess in between
  const lastHintAttempt = hintsUsedAtAttempts.length > 0 ? 
    hintsUsedAtAttempts[hintsUsedAtAttempts.length - 1] : -1;
  const isConsecutiveHint = lastHintAttempt === attempts;
  
  // Must meet all three conditions to use a hint
  const canUseHint = hintsRemaining > 0 && hasEnoughGuesses && !isConsecutiveHint;

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Normal Mode Tutorial Popup - with smoother animation */}
      {showNormalModeTutorial && difficultyMode === 'normal' && (
        <motion.div 
          className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <motion.h3 
                className="text-lg font-bold flex items-center"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Flame className="w-5 h-5 mr-2 text-secondary" /> Normal Mode
              </motion.h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => dismissTutorial('normal')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <motion.div 
              className="space-y-3 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p>Welcome to <strong>Fusdle</strong>! In this game, you'll guess words or phrases that combine the concepts shown by the emojis.</p>
              <p>In <strong>Normal Mode</strong>:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You have unlimited attempts to guess the answer</li>
                <li>You can request hints after each guess</li>
                <li>The word count is shown to help you</li>
                <li>Completing today's puzzle unlocks Hard Mode</li>
              </ul>
              <p className="text-secondary font-medium">Make your first guess to begin!</p>
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                className="w-full mt-4" 
                onClick={() => dismissTutorial('normal')}>
                Play
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Hard Mode Tutorial Popup - with smoother animation */}
      {showHardModeTutorial && difficultyMode === 'hard' && (
        <motion.div 
          className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <motion.h3 
                className="text-lg font-bold flex items-center"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Skull className="w-5 h-5 mr-2 text-destructive" /> Hard Mode
              </motion.h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => dismissTutorial('hard')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <motion.div 
              className="space-y-3 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p>You've unlocked <strong>Hard Mode</strong>! This is a more challenging version of Fusdle with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>More difficult puzzles</li>
                <li>More emojis in each puzzle</li>
                <li>Hints will affect your flawless streak</li>
                <li>Solve without hints for a perfect score!</li>
              </ul>
              <p className="text-destructive font-medium">Good luck - you'll need it!</p>
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                variant="destructive"
                className="w-full mt-4" 
                onClick={() => dismissTutorial('hard')}>
                Play Hard Mode
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {/* Using puzzle's date for Fusdle number, not today's date */}
          <span>Fusdle #{calculateFusdleNumber(puzzle.date, puzzle.puzzleNumber)}</span>
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
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`difficulty-badge-${difficultyMode}`}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ 
                duration: 0.25,
                type: "spring", 
                stiffness: 500,
                damping: 25
              }}
            >
              <Badge 
                variant={puzzle?.difficulty === 'hard' ? 'destructive' : 'secondary'}
                className="text-xs py-1 pl-1.5 pr-2 flex items-center gap-1"
              >
                {puzzle?.difficulty === 'hard' ? (
                  <span className="flex items-center">
                    <Skull className="h-3 w-3" /> Hard Mode
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Flame className="h-3 w-3" /> Normal Mode
                  </span>
                )}
              </Badge>
            </motion.div>
          </AnimatePresence>
          
          {/* Add fusion twist badge */}
          {puzzle.isFusionTwist === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ 
                delay: 0.15,
                type: "spring", 
                stiffness: 500,
                damping: 25
              }}
              onClick={() => showFusionPopup(puzzle.twistType)}
              className="cursor-pointer relative group"
              title="Click to learn about Fusion Twist puzzles"
            >
              <Badge 
                variant="outline"
                className="text-xs py-1 pl-1.5 pr-2 flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none group-hover:shadow-lg group-hover:scale-105 transition-all"
              >
                <span className="flex items-center">
                  <span className="animate-spin-slow">🌀</span> Fusion Twist!
                </span>
              </Badge>
              
              {/* Tiny hint indicator that this is clickable */}
              <span className="absolute -bottom-1 -right-1 bg-white text-[8px] rounded-full px-1 py-0 shadow-sm opacity-90 group-hover:opacity-100">
                ℹ️
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <EmojiDisplay emojis={puzzle.emojis} />

      {/* Word count hint */}
      {puzzle.wordCount && (
        <div className="flex items-center justify-center my-2 text-sm text-gray-500">
          <span className="mr-1">🧠</span>
          <span className="font-medium">{puzzle.wordCount} {puzzle.wordCount === 1 ? 'word' : 'words'}</span>
        </div>
      )}

      {/* Input form area - only add height when actively playing */}
      {gameStatus === 'playing' && !hasCompleted ? (
        <div className="px-1"> {/* Add padding to prevent overflow on mobile */}
          <motion.form 
            className="mb-6 w-full max-w-full" 
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex w-full max-w-full overflow-hidden">
              <input
                ref={inputRef}
                type="text"
                className="flex-grow min-w-0 rounded-l-lg border border-gray-300 outline-none p-3 text-lg focus:ring-2 focus:ring-secondary focus:border-secondary focus:outline-none"
                placeholder="Enter your guess"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                autoComplete="off"
                disabled={isSubmitting}
                style={{ outline: 'none' }}
              />
              <button
                type="submit"
                className={`bg-secondary text-white rounded-r-lg px-3 sm:px-4 font-medium whitespace-nowrap transition ${
                  isSubmitting ? "opacity-70" : "hover:bg-secondary/90"
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "..." : "Guess"}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}

      {gameStatus === 'playing' && !hasCompleted ? (
        <>
          {/* Move attempts counter to its own section above the buttons */}
          <div className="flex justify-center items-center mb-3">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <span className="font-medium">{attempts}</span> {attempts === 1 ? 'guess' : 'guesses'} made
            </div>
          </div>
          
          {/* Action buttons row */}
          <div className="flex justify-center items-center mb-4 gap-2">
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

          <Hints hints={revealedHints} />
          
          {/* Previous Guesses - Redesigned completely outside of accordion with clear highlighting */}
          {previousGuesses.length > 0 && (
            <div className="mt-3 mb-3">
              <div className="w-full border border-gray-200 rounded-lg">
                {/* Header */}
                <div className="px-4 py-2 flex items-center justify-between bg-gray-50 rounded-t-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <span>Previous Guesses ({previousGuesses.length})</span>
                  </div>
                </div>
                
                {/* Content - Always visible and not in accordion */}
                <div className="px-4 pb-3 pt-2">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {/* Reverse the array to show newest guesses first */}
                    {[...previousGuesses].reverse().map((guess, reversedIndex) => {
                      // Calculate the original index (for partial matches and display)
                      const originalIndex = previousGuesses.length - reversedIndex - 1;
                      
                      // Get partial matches data from localStorage
                      let partialMatches: number[] = [];
                      try {
                        const storageKey = `fusdle_partial_${puzzle?.id}_${difficultyMode}`;
                        const storedPartialMatches = localStorage.getItem(storageKey);
                        
                        if (storedPartialMatches) {
                          partialMatches = JSON.parse(storedPartialMatches);
                        }
                      } catch (e) {
                        console.error('Error retrieving partial matches:', e);
                      }
                      
                      // Check if this guess is a partial match - use original index
                      const isPartialMatch = partialMatches.includes(originalIndex);
                      
                      // Try to get the saved matched word for this specific guess
                      let savedMatchedWord: string | null = null;
                      if (isPartialMatch) {
                        try {
                          const matchedWordsKey = `fusdle_matched_words_${puzzle?.id}_${difficultyMode}`;
                          const storedMatchedWords = localStorage.getItem(matchedWordsKey);
                          if (storedMatchedWords) {
                            const matchedWords = JSON.parse(storedMatchedWords);
                            // Convert index to string for safer access
                            const indexKey = originalIndex.toString();
                            console.log(`Looking for matched word for guess ${originalIndex} (key="${indexKey}") in:`, matchedWords);
                            
                            // First try direct index access
                            if (matchedWords && matchedWords[indexKey]) {
                              savedMatchedWord = matchedWords[indexKey];
                              console.log(`Found saved matched word for guess ${originalIndex}: "${savedMatchedWord}"`);
                            } 
                            // If nothing found, try to extract from the feedback message
                            else if (partialMatchFeedback) {
                              // Try to extract the word from the feedback message
                              const quotedPattern = /"([^"]+)"/i;
                              const quotedMatch = partialMatchFeedback.match(quotedPattern);
                              
                              if (quotedMatch && quotedMatch[1]) {
                                savedMatchedWord = quotedMatch[1];
                                console.log(`Extracted matched word from feedback: "${savedMatchedWord}"`);
                                
                                // Also save this match for future reference
                                matchedWords[indexKey] = savedMatchedWord;
                                localStorage.setItem(matchedWordsKey, JSON.stringify(matchedWords));
                              } else {
                                console.log(`No saved matched word found for guess ${originalIndex}`);
                              }
                            } else {
                              console.log(`No saved matched word found for guess ${originalIndex}`);
                            }
                          }
                        } catch (e) {
                          console.error('Error retrieving matched word:', e);
                        }
                      }
                      
                      // Any partial match should show the highlighting if feedback is available or we have a saved matched word
                      const shouldHighlight = isPartialMatch && (partialMatchFeedback !== null || savedMatchedWord !== null);
                      
                      // For the most recent guess, use the current matchedWord from state
                      // For older guesses, use their saved matched word from localStorage
                      const effectiveMatchedWord = 
                        reversedIndex === 0 ? matchedWord : savedMatchedWord;
                      
                      console.log(`Guess ${originalIndex}: Using matched word "${effectiveMatchedWord}" (reversedIndex=${reversedIndex}, matchedWord=${matchedWord}, savedMatchedWord=${savedMatchedWord})`);
                      
                      return (
                        <div 
                          key={`${guess}-${originalIndex}`} 
                          className={`p-2 rounded text-sm flex justify-between items-center ${
                            isPartialMatch 
                              ? 'bg-green-50 border border-green-100' 
                              : 'bg-gray-50'
                          }`}
                        >
                          {isPartialMatch ? (
                            <div className="font-medium text-gray-700">
                              {shouldHighlight
                                ? highlightPartialMatch(
                                    guess, 
                                    partialMatchFeedback || "You're on the right track!", 
                                    effectiveMatchedWord
                                  )
                                : guess}
                              <div className="text-xs text-green-600 mt-1">
                                Contains a partial match
                              </div>
                            </div>
                          ) : (
                            <span className="font-medium text-gray-700">{guess}</span>
                          )}
                          <span className="text-xs text-gray-500">#{originalIndex + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
        <div className="p-3 bg-neutral/60 rounded-lg text-center mt-2 mb-2">
          <div className="flex items-center justify-center text-primary">
            <span className="text-sm mr-1">✅</span>
            <p className="font-medium">You've already completed this puzzle</p>
          </div>
          
          {/* Development-only buttons - will be hidden in production */}
          {import.meta.env.DEV && (
            <div className="flex justify-center space-x-2 mt-2">
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
      
      {/* Fusion Twist Explanation Dialog */}
      <Dialog open={showFusionDialog} onOpenChange={setShowFusionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="mr-2 animate-spin-slow">🌀</span> Fusion Twist Puzzle
            </DialogTitle>
            <DialogDescription>
              You've discovered a special Fusion Twist puzzle!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2">{currentTwistType} Style</h3>
              <p>
                {getFusionTwistDescription(currentTwistType)}
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <p>Fusion Twist puzzles appear twice a week and offer unique word combinations and creative challenges.</p>
              <p>Use the same game mechanics, but expect more surprising and creative answers!</p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => setShowFusionDialog(false)}
              className="w-full sm:w-auto"
            >
              Got It!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Helper function to provide descriptions for different fusion twist types
const getFusionTwistDescription = (twistType: string | null | undefined): string => {
  if (!twistType) return 'This special puzzle features unique twists on the standard format. Expect creative and unexpected answers!';
  
  switch (twistType) {
    case 'Wordplay':
      return 'This puzzle uses creative wordplay, puns, or double meanings. Think outside the box!';
    case 'Pop Culture':
      return 'References movies, TV shows, music, or other elements of popular culture. Think of iconic lines or characters!';
    case 'Movie Mash':
      return 'Combines elements from popular movies or film genres. Think cinematic!';
    case 'Food Fusion':
      return 'Combines culinary concepts or food items in unexpected ways. Think delicious combinations!';
    case 'Animal Fusion':
      return 'Combines animal concepts or creates mythical creature references. Think wild combinations!';
    case 'Funny Lore':
      return 'References internet memes, inside jokes, or funny cultural stories. Think viral!';
    default:
      return 'This special puzzle features unique twists on the standard format. Expect creative and unexpected answers!';
  }
};

export default GameCard;