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
          Fusdle is a daily emoji fusion puzzle game where you guess the word, phrase, or concept
          represented by a set of emojis. Each puzzle is carefully crafted to challenge 
          your creative thinking and word association skills!
        </p>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">How to Play</h3>
          <ol className="list-decimal pl-5 space-y-3">
            <li>Examine the daily emoji combination</li>
            <li>Think about what concept these emojis might represent together</li>
            <li>Type your guess in the input box and submit</li>
            <li>You'll get feedback on whether your guess was correct, partially correct, or incorrect</li>
            <li>Use hints if you're stuck, but be aware this will reset your flawless streak</li>
            <li>You have unlimited attempts to solve each day's puzzles</li>
            <li>A new puzzle is available at midnight EST every day</li>
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
                <li>Standard difficulty puzzles with fewer emojis</li>
                <li>Shows the word count to help guide your guesses</li>
                <li>Available to all players daily</li>
                <li>Complete to unlock Hard Mode for the day</li>
                <li>Unlimited attempts with optional hints</li>
              </ul>
            </div>
            
            <div className="rounded-lg p-4 bg-muted">
              <h4 className="font-bold flex items-center">
                <span className="mr-2">💀</span>
                Hard Mode
              </h4>
              <ul className="list-disc pl-5 mt-2">
                <li>More challenging puzzles with additional emojis</li>
                <li>More complex concepts and word combinations</li>
                <li>Unlocked after completing the day's Normal Mode puzzle</li>
                <li>Hints are available but will reset your flawless streak</li>
                <li>Perfect for players seeking an extra challenge</li>
              </ul>
            </div>
            
            <div className="rounded-lg p-4 bg-muted">
              <h4 className="font-bold flex items-center">
                <span className="mr-2">🌀</span>
                Fusion Twist
              </h4>
              <ul className="list-disc pl-5 mt-2">
                <li>Special themed puzzles appearing twice weekly</li>
                <li>Features creative word combinations with special themes like wordplay, metaphors, or idioms</li>
                <li>Available in both Normal and Hard difficulties</li>
                <li>Look for the special fusion twist indicator on puzzle days</li>
                <li>Extra challenging but extra satisfying to solve!</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">Example Puzzles</h3>
          
          <div className="space-y-3">
            <div className="rounded-lg p-4 bg-muted border-l-4 border-secondary">
              <div className="flex justify-between items-center mb-2">
                <div className="text-2xl">🍿😱</div>
                <span className="text-xs font-semibold bg-secondary/20 text-secondary px-2 py-1 rounded-full">Normal Mode</span>
              </div>
              <p><strong>Answer:</strong> Popcorn Panic</p>
              <p><strong>Fusion Type:</strong> Movie Mash</p>
              <p className="text-sm text-gray-500 mt-1">A simple fusion of two related concepts - the snack most associated with movies (popcorn) and the emotion often felt during horror films (panic).</p>
            </div>
            
            <div className="rounded-lg p-4 bg-muted border-l-4 border-destructive">
              <div className="flex justify-between items-center mb-2">
                <div className="text-2xl">🌊🏠🌪️</div>
                <span className="text-xs font-semibold bg-destructive/20 text-destructive px-2 py-1 rounded-full">Hard Mode</span>
              </div>
              <p><strong>Answer:</strong> Storm Shelter</p>
              <p><strong>Fusion Type:</strong> Weather Safety</p>
              <p className="text-sm text-gray-500 mt-1">A more complex hard mode puzzle using three emojis representing elements of severe weather (water/waves, housing, wind/tornado) to form a concept related to safety during storms.</p>
            </div>
            
            <div className="rounded-lg p-4 bg-muted border-l-4 border-purple-500">
              <div className="flex justify-between items-center mb-2">
                <div className="text-2xl">📚🐛</div>
                <span className="text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">Fusion Twist</span>
              </div>
              <p><strong>Answer:</strong> Bookworm</p>
              <p><strong>Fusion Type:</strong> Wordplay</p>
              <p className="text-sm text-gray-500 mt-1">A special fusion twist puzzle playing with idioms - "bookworm" isn't literally about worms, but rather someone who loves reading. The twist is in the metaphorical use of "worm" in this context.</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">Sharing Results</h3>
          <p>
            After solving a puzzle, share your results with friends to show off your wordplay skills!
            Your share includes:
          </p>
          <div className="p-4 bg-muted rounded-lg my-3 text-sm font-medium">
            <p>Fusdle #42 ⬛🟨🟩</p>
            <p>📚🐛</p>
            <p>🔥 Normal Mode</p>
            <p>💡 Hints used: 1/3</p>
            <p>✨ Flawless Streak: 0</p>
            <p>Play at: fusdle.com</p>
          </div>
          <ul className="list-disc pl-5 mt-2">
            <li><span className="font-medium text-green-600">🟩</span> Green squares show correct guesses</li>
            <li><span className="font-medium text-yellow-500">🟨</span> Yellow squares show partial matches (when you got part of the answer)</li>
            <li><span className="font-medium text-gray-800">⬛</span> Black squares show incorrect guesses</li>
            <li>Your flawless streak is included for bragging rights when you solve without hints</li>
            <li>Special twist puzzles will include a 🌀 symbol in your share</li>
          </ul>
          <p className="mt-3 text-sm italic">The more concise your solve pattern (fewer squares), the more impressive your result!</p>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">Streak System</h3>
          <div className="space-y-4">
            <div className="bg-secondary/10 rounded-lg p-4">
              <h4 className="font-bold flex items-center">
                <span className="mr-2">🔥</span>
                Regular Streak
              </h4>
              <p>Your regular streak increases by 1 each day you successfully solve at least one puzzle. This streak tracks your daily consistency.</p>
              <p className="text-sm mt-2 font-medium">How to maintain: Solve at least one puzzle every day</p>
              <p className="text-sm mt-1 font-medium">How it resets: Missing a full day without solving any puzzle</p>
            </div>
            
            <div className="bg-amber-100 rounded-lg p-4">
              <h4 className="font-bold flex items-center text-amber-700">
                <span className="mr-2">✨</span>
                Flawless Streak
              </h4>
              <p>Your flawless streak increases when you solve puzzles without using any hints. This is the true measure of puzzle-solving prowess!</p>
              <p className="text-sm mt-2 font-medium">How to maintain: Solve puzzles without using any hints</p>
              <p className="text-sm mt-1 font-medium">How it resets: Using even a single hint on any puzzle</p>
              <p className="text-sm mt-2 italic">Flawless streaks are displayed in your share results, giving you bragging rights for consistently clever solves!</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-5 mt-2">
          <h3 className="text-xl font-bold mb-3 text-primary">About the Developer</h3>
          <p>
            Fusdle was created with ❤️ by Shawn Dean and is inspired by word games like Wordle.
            The game features a growing collection of hand-crafted puzzles with new puzzles generated for 90+ days at a time.
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
