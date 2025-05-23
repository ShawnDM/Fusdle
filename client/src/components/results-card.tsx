import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/game-store";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Confetti from "react-confetti";
import { Badge } from "@/components/ui/badge";
import { Skull, Flame, Sparkles, ListIcon } from "lucide-react";
import { calculateFusdleNumber } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ResultsCard: React.FC = () => {
  const { 
    puzzle, 
    gameStatus, 
    attempts, 
    shareResult, 
    resetForDevelopment,
    difficultyMode,
    flawlessStreak,
    streak,
    previousGuesses
  } = useGameStore();
  const [copying, setCopying] = useState(false);
  const [timeUntilNextPuzzle, setTimeUntilNextPuzzle] = useState<string>('');
  const { toast } = useToast();

  // Add window size state for confetti
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 0, 
    height: typeof window !== 'undefined' ? window.innerHeight : 0 
  });

  useEffect(() => {
    // Calculate time until midnight (12 AM) EST for all users regardless of their timezone
    const calculateTimeUntilNextPuzzle = () => {
      // Get current time
      const now = new Date();
      
      // This function uses a simple approach to calculate time until midnight ET
      // Find the current ET time to calculate when the next puzzle will be available
      const etTimeStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const currentET = new Date(etTimeStr);
      
      // Create a new date for midnight tonight in ET
      const midnightET = new Date(etTimeStr);
      midnightET.setHours(24, 0, 0, 0); // Next midnight
      
      // Convert both dates to milliseconds for calculation
      const msSinceMidnight = currentET.getTime() - new Date(etTimeStr).setHours(0, 0, 0, 0);
      const msInDay = 24 * 60 * 60 * 1000;
      const msUntilMidnight = msInDay - msSinceMidnight;
      
      // Convert ms to hours, minutes, seconds
      const hours = Math.floor(msUntilMidnight / (1000 * 60 * 60));
      const minutes = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((msUntilMidnight % (1000 * 60)) / 1000);
      
      // Format time string
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    // Update timer immediately and then every second
    setTimeUntilNextPuzzle(calculateTimeUntilNextPuzzle());
    const interval = setInterval(() => {
      setTimeUntilNextPuzzle(calculateTimeUntilNextPuzzle());
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);
  
  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!puzzle || gameStatus === 'playing') {
    return null;
  }

  const isWin = gameStatus === 'won';
  const shareText = shareResult();

  const handleShare = async () => {
    setCopying(true);
    try {
      // Only use clipboard API, never use navigator.share
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "Your result has been copied to the clipboard."
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy your result. Try selecting and copying manually.",
        variant: "destructive"
      });
    } finally {
      setCopying(false);
    }
  };
  
  return (
    <>
      {/* Show confetti when the user wins */}
      {isWin && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          colors={['#FFC0CB', '#9370DB', '#FFD700', '#87CEFA', '#32CD32']}
          tweenDuration={10000}
        />
      )}
      <motion.div
        className={`bg-white rounded-2xl shadow-lg p-6 animate-fade-in ${
          difficultyMode === 'hard' 
            ? 'border-2 border-red-600' 
            : puzzle?.isFusionTwist === 1 
              ? 'border-2 border-purple-500 bg-gradient-to-br from-white to-purple-50' 
              : ''
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className={`text-4xl mb-2 ${isWin ? "text-success" : "text-destructive"}`}>
            {isWin ? "🎉" : "😢"}
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {isWin ? "Congratulations!" : "Nice Try!"}
          </h2>
          <p className="text-lg font-medium text-gray-700 mb-2">
            Fusdle #{calculateFusdleNumber()}
          </p>
          
          {/* Difficulty badge */}
          <div className="flex justify-center mb-3 gap-2">
            {/* Show Difficulty Badge */}
            <Badge 
              variant={puzzle?.difficulty === 'hard' ? 'destructive' : 'secondary'}
              className="text-xs py-1 pl-1.5 pr-2 flex items-center gap-1"
            >
              {puzzle?.difficulty === 'hard' ? (
                <>
                  <Skull className="h-3 w-3" /> Hard Mode
                </>
              ) : (
                <>
                  <Flame className="h-3 w-3" /> Normal Mode
                </>
              )}
            </Badge>
            
            {/* Show Fusion Twist Badge if applicable */}
            {puzzle.isFusionTwist === 1 && puzzle.twistType && (
              <Badge 
                variant="outline"
                className="text-xs py-1 pl-1.5 pr-2 flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100"
              >
                <Sparkles className="h-3 w-3" />
                {puzzle.twistType}
              </Badge>
            )}
          </div>
          
          <p className="mb-4">
            {isWin
              ? `You guessed it correctly in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`
              : `You'll get it next time!`}
          </p>
          
          {/* Display current streaks when player wins */}
          {isWin && (
            <div className="flex justify-center gap-3 mb-4">
              <div className="px-4 py-2 bg-secondary/10 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Regular Streak</p>
                <p className="text-xl font-bold text-secondary flex items-center justify-center">
                  <span className="mr-1">🔥</span> {streak}
                </p>
              </div>
              <div className="px-4 py-2 bg-amber-100 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Flawless Streak</p>
                <p className="text-xl font-bold text-amber-700 flex items-center justify-center">
                  <span className="mr-1">✨</span> {flawlessStreak}
                </p>
              </div>
            </div>
          )}
          <div className="mb-4 p-4 bg-neutral rounded-lg">
            <p className="font-medium mb-2">The answer was:</p>
            <p className="text-xl font-bold">{puzzle.answer}</p>
          </div>
          <button
            className="w-full bg-accent text-gray-900 font-bold py-3 px-6 rounded-lg shadow hover:bg-accent/90 transition flex justify-center items-center space-x-2"
            onClick={handleShare}
            disabled={copying}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>{copying ? "Copying..." : "Copy Results to Clipboard"}</span>
          </button>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm font-medium">
            {shareText.split('\n').map((line, index) => {
              // Style lines differently based on content
              if (line.includes('Hard Mode')) {
                return (
                  <p key={index} className="text-red-600 font-bold">
                    {line}
                  </p>
                );
              } else if (line.includes('Normal Mode')) {
                return (
                  <p key={index} className="text-purple-600 font-bold">
                    {line}
                  </p>
                );
              } else if (line.includes('streak')) {
                return (
                  <p key={index} className="text-amber-600 font-bold">
                    {line}
                  </p>
                );
              } else if (line.includes('fusion twist')) {
                return (
                  <p key={index} className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text font-bold">
                    {line}
                  </p>
                );
              } else {
                // Colorize the emoji indicators in the share text 
                if (line.includes('🟩') || line.includes('🟨') || line.includes('⬛') || line.includes('⬜') || line.includes('🔥') || line.includes('❌')) {
                  return (
                    <p key={index} className="font-medium text-2xl">
                      {Array.from(line).map((char, i) => {
                        // Apply different colors based on emoji symbols
                        if (char === '🟩') {
                          return <span key={i} className="text-green-500">{char}</span>;
                        } else if (char === '🟨') {
                          return <span key={i} className="text-yellow-500">{char}</span>;
                        } else if (char === '⬛') {
                          return <span key={i} className="text-gray-800 dark:text-gray-400">{char}</span>;
                        } else if (char === '⬜') {
                          return <span key={i} className="text-gray-300">{char}</span>;
                        } else if (char === '🔥') {
                          return <span key={i} className="text-red-500">{char}</span>;
                        } else if (char === '❌') {
                          return <span key={i} className="text-red-400">{char}</span>;
                        } else {
                          return char;
                        }
                      })}
                    </p>
                  );
                }
                return <p key={index} className="my-1">{line}</p>;
              }
            })}
          </div>
          
          {/* All Guesses Accordion */}
          {previousGuesses && previousGuesses.length > 0 && (
            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="guesses">
                  <AccordionTrigger className="flex items-center justify-center py-2 text-sm">
                    <div className="flex items-center gap-1">
                      <ListIcon className="h-4 w-4" />
                      <span>View All Guesses ({previousGuesses.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-3 bg-gray-50 rounded-lg mt-2 max-h-52 overflow-y-auto">
                      <ul className="space-y-1.5 divide-y divide-gray-100">
                        {previousGuesses.map((guess, index) => {
                          // Check if this is the winning guess (for the last guess only)
                          const isWinningGuess = isWin && 
                            index === previousGuesses.length - 1 && 
                            guess.toLowerCase() === puzzle?.answer?.toLowerCase();
                            
                          return (
                            <li 
                              key={`${guess}-${index}`} 
                              className={`py-1.5 px-1 text-sm flex justify-between items-center ${
                                isWinningGuess ? 'bg-green-50 rounded' : ''
                              }`}
                            >
                              <span className={`font-medium ${isWinningGuess ? 'text-green-700' : 'text-gray-700'}`}>
                                {guess}
                              </span>
                              <div className="flex items-center">
                                {isWinningGuess && <span className="ml-1 text-green-600">✓</span>}
                                <span className={`${isWinningGuess ? 'ml-1' : ''} text-xs text-gray-500`}>
                                  #{index + 1}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                        
                        {/* Only show the answer separately if the last guess wasn't correct */}
                        {isWin && 
                         previousGuesses.length > 0 && 
                         puzzle?.answer &&
                         previousGuesses[previousGuesses.length - 1].toLowerCase() !== puzzle?.answer?.toLowerCase() && (
                          <li className="py-1.5 px-1 text-sm flex justify-between items-center bg-green-50 rounded mt-2">
                            <span className="font-medium text-green-700">{puzzle?.answer}</span>
                            <div className="flex items-center">
                              <span className="ml-1 text-green-600">✓</span>
                              <span className="ml-1 text-xs text-gray-500">#{previousGuesses.length + 1}</span>
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
          
          {/* Next puzzle countdown timer */}
          <div className="mt-6 p-4 bg-neutral/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Next puzzle in:</p>
            <p className="text-xl font-bold text-primary">{timeUntilNextPuzzle}</p>
            <p className="text-xs text-gray-500 mt-1">New puzzles at midnight Eastern Time (EST/EDT)</p>
            <p className="text-xs text-gray-400 mt-1">Same time for all players worldwide</p>
            
            {/* Development-only reset button - will be hidden in production */}
            {import.meta.env.DEV && (
              <button
                onClick={() => resetForDevelopment()}
                className="mt-3 bg-black text-white text-xs rounded-lg px-2 py-1 opacity-50 hover:opacity-80 transition-opacity"
                title="Dev only: Reset puzzle for testing"
              >
                🛠️ DEV RESET
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ResultsCard;
