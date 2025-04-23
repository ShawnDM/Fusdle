import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/game-store";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Confetti from "react-confetti";
import { Badge } from "@/components/ui/badge";
import { Skull, Flame, Sparkles } from "lucide-react";

const ResultsCard: React.FC = () => {
  const { 
    puzzle, 
    gameStatus, 
    attempts, 
    shareResult, 
    resetForDevelopment,
    difficultyMode 
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
    // Calculate time until midnight EST
    const calculateTimeUntilNextPuzzle = () => {
      const now = new Date();
      
      // Get tomorrow's date at midnight EST
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Convert to EST
      const options = { timeZone: 'America/New_York' };
      const estMidnight = new Date(tomorrow.toLocaleString('en-US', options));
      
      // Calculate time difference in milliseconds
      const diffMs = estMidnight.getTime() - now.getTime();
      
      // Convert to hours, minutes, seconds
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
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
          <h2 className="text-2xl font-bold mb-2">
            {isWin ? "Congratulations!" : "Nice Try!"}
          </h2>
          
          {/* Difficulty badge */}
          <div className="flex justify-center mb-3 gap-2">
            {/* Show Difficulty Badge */}
            <Badge 
              variant={difficultyMode === 'hard' ? 'destructive' : 'secondary'}
              className="text-xs py-1 pl-1.5 pr-2 flex items-center gap-1"
            >
              {difficultyMode === 'hard' ? (
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
                return <p key={index}>{line}</p>;
              }
            })}
          </div>
          
          {/* Next puzzle countdown timer */}
          <div className="mt-6 p-4 bg-neutral/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Next puzzle in:</p>
            <p className="text-xl font-bold text-primary">{timeUntilNextPuzzle}</p>
            <p className="text-xs text-gray-500 mt-1">New puzzles at midnight EST</p>
            
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
          
          {/* Social Media Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <a 
              href="https://x.com/shawndean_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center hover:bg-purple-200 transition-colors"
              aria-label="Twitter/X"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a 
              href="https://ko-fi.com/shawndean" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center hover:bg-purple-200 transition-colors"
              aria-label="Ko-fi"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
              </svg>
            </a>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ResultsCard;
