import { motion } from "framer-motion";
import { useEffect } from "react";
import { navigationState, updateNavigationState } from "@/lib/queryClient";

const About: React.FC = () => {
  // Track that the user visited the About page in navigation state
  useEffect(() => {
    // Update the last visited page in navigation state
    updateNavigationState({ lastPageVisited: '/about' });
  }, []);
  
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} // Slightly faster animation for better responsiveness
    >
      <h2 className="text-2xl font-bold mb-4 text-primary">What is Fusdle?</h2>
      <div className="space-y-5 text-gray-700">
        <p className="text-lg">
          Fusdle is a daily word puzzle game where you guess the fused word, phrase, or concept
          represented by a combination of emojis. Each puzzle is carefully crafted to challenge 
          your creative thinking skills!
        </p>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">How to Play</h3>
          <ol className="list-decimal pl-5 space-y-3">
            <li>Look at the daily emoji combination</li>
            <li>Type your guess in the input box</li>
            <li>If your guess contains part of the correct answer, you'll receive partial match feedback</li>
            <li>If needed, use hints to help you solve the puzzle (but this affects your flawless streak)</li>
            <li>Solve the puzzle within the allowed attempts to increase your streak</li>
            <li>Return daily at midnight EST for a new Fusdle!</li>
          </ol>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">Game Modes</h3>
          
          <div className="space-y-4">
            <div className="rounded-lg p-4 bg-muted">
              <h4 className="font-bold flex items-center">
                <span className="mr-2">🔥</span>
                Normal Mode
              </h4>
              <ul className="list-disc pl-5 mt-2">
                <li>3 attempts to solve the puzzle</li>
                <li>Up to 3 hints available</li>
                <li>Available daily to all players</li>
                <li>Must be completed to unlock Hard Mode</li>
              </ul>
            </div>
            
            <div className="rounded-lg p-4 bg-muted">
              <h4 className="font-bold flex items-center">
                <span className="mr-2">💀</span>
                Hard Mode
              </h4>
              <ul className="list-disc pl-5 mt-2">
                <li>4 attempts to solve more challenging puzzles</li>
                <li>Up to 3 hints available</li>
                <li>Unlocked after completing the day's Normal Mode puzzle</li>
                <li>More complex word combinations and concepts</li>
              </ul>
            </div>
            
            <div className="rounded-lg p-4 bg-muted">
              <h4 className="font-bold flex items-center">
                <span className="mr-2">🌀</span>
                Fusion Twist
              </h4>
              <ul className="list-disc pl-5 mt-2">
                <li>Special puzzles occurring twice weekly</li>
                <li>Available in both Normal and Hard difficulties</li>
                <li>Features creative word combinations with special themes</li>
                <li>Marked with a special fusion twist badge when sharing</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">Example Puzzles</h3>
          
          <div className="space-y-3">
            <div className="rounded-lg p-4 bg-muted">
              <div className="text-2xl mb-2">🏡🧹</div>
              <p><strong>Answer:</strong> Housekeeping</p>
              <p><strong>Fusion:</strong> House + Keeping</p>
            </div>
            
            <div className="rounded-lg p-4 bg-muted">
              <div className="text-2xl mb-2">🐍📚</div>
              <p><strong>Answer:</strong> Bookworm</p>
              <p><strong>Fusion:</strong> Book + Worm</p>
            </div>
            
            <div className="rounded-lg p-4 bg-muted">
              <div className="text-2xl mb-2">🌊🧠</div>
              <p><strong>Answer:</strong> Brain Wave</p>
              <p><strong>Fusion:</strong> Brain + Wave</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">Sharing Results</h3>
          <p>
            After completing a puzzle, you can share your results with friends.
            Your share includes:
          </p>
          <div className="p-4 bg-muted rounded-lg my-3 text-sm font-medium">
            <p>Fusdle #42 ⬛🟨🟩</p>
            <p>🐍📚</p>
            <p>🔥 Normal Mode</p>
            <p>💡 Hints used: 1/3</p>
            <p>Play at: fusdle.com</p>
          </div>
          <ul className="list-disc pl-5 mt-2">
            <li><span className="text-green-500">🟩</span> Green squares show correct guesses</li>
            <li><span className="text-yellow-500">🟨</span> Yellow squares show partial matches or hint usage</li>
            <li><span className="text-gray-800 dark:text-gray-400">⬛</span> Black squares show incorrect guesses</li>
            <li>The difficulty mode (Normal/Hard) and any special fusion twist</li>
            <li>Hints used and streak information if applicable</li>
          </ul>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">Streaks & Achievements</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-bold flex items-center">
                <span className="mr-2">🎯</span>
                Regular Streak
              </h4>
              <p>Increases each day you successfully solve at least one puzzle. Missing a day resets your streak to zero.</p>
            </div>
            
            <div>
              <h4 className="font-bold flex items-center">
                <span className="mr-2">✨</span>
                Flawless Streak
              </h4>
              <p>Special streak that only increases when you solve puzzles without using any hints. Using hints will reset this streak.</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">About the Developer</h3>
          <p>
            Fusdle was created with ❤️ by Shawn Dean and is inspired by word games like Wordle.
            The game features 180+ hand-crafted puzzles with regular updates.
          </p>
          <p className="mt-2">
            Connect with the developer:
          </p>
          <div className="flex space-x-2 mt-2">
            <a 
              href="https://x.com/shawndean_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Twitter/X
            </a>
            <span>•</span>
            <a 
              href="https://ko-fi.com/shawndean" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ko-fi
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default About;
