import { Link } from "wouter";
import { motion } from "framer-motion";
import { Archive, Home, Info, FileText, Menu, X, HelpCircle, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { userDataService, type UserStats } from "@/lib/user-data-service";
import UserMenu from "@/components/user-menu";

interface NavTabsProps {
  currentPath: string;
}

// Statistics component to display user data
const StatisticsContent: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await userDataService.getUserStats();
        const detailed = await userDataService.getDetailedStats();
        setStats(userStats);
        setDetailedStats(detailed);
      } catch (error) {
        console.error("Error loading user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center">Loading statistics...</div>;
  }

  if (!stats || !detailedStats) {
    return <div className="text-center text-gray-500">Unable to load statistics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
        <div className="text-3xl font-bold text-purple-700">{detailedStats.overall.winRate}%</div>
        <div className="text-sm text-purple-600 font-medium">Overall Win Rate</div>
        <div className="text-xs text-purple-500 mt-1">
          {detailedStats.overall.totalSolved} solved of {detailedStats.overall.totalAttempted} attempted
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 text-center">Performance by Difficulty</h4>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Normal Mode */}
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Normal</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-700">{detailedStats.normal.solved}</div>
              <div className="text-xs text-green-600">Puzzles Completed</div>
              <div className="text-xs text-green-500">
                {detailedStats.normal.attempted > 0 
                  ? `${Math.round((detailedStats.normal.solved / detailedStats.normal.attempted) * 100)}% success • Avg ${detailedStats.normal.avgGuesses} guesses`
                  : 'No attempts yet'
                }
              </div>
            </div>
          </div>

          {/* Hard Mode */}
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-800">Hard</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-700">{detailedStats.hard.solved}</div>
              <div className="text-xs text-red-600">Puzzles Completed</div>
              <div className="text-xs text-red-500">
                {detailedStats.hard.attempted > 0 
                  ? `${Math.round((detailedStats.hard.solved / detailedStats.hard.attempted) * 100)}% success • Avg ${detailedStats.hard.avgGuesses} guesses`
                  : 'No attempts yet'
                }
              </div>
            </div>
          </div>

          {/* Fusion Twists */}
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-800">Fusion Twists</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-700">{detailedStats.fusion.solved}</div>
              <div className="text-xs text-orange-600">Puzzles Completed</div>
              <div className="text-xs text-orange-500">
                {detailedStats.fusion.attempted > 0 
                  ? `${Math.round((detailedStats.fusion.solved / detailedStats.fusion.attempted) * 100)}% success • Avg ${detailedStats.fusion.avgGuesses} guesses`
                  : 'No attempts yet'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600">{stats.currentStreak}</div>
          <div className="text-xs text-blue-600">Current Streak</div>
        </div>
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <div className="text-xl font-bold text-indigo-600">{stats.maxStreak}</div>
          <div className="text-xs text-indigo-600">Best Streak</div>
        </div>
      </div>

      {/* Flawless Streak */}
      {stats.flawlessStreak > 0 && (
        <div className="text-center p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
          <div className="text-xl font-bold text-yellow-700">🔥 {stats.flawlessStreak}</div>
          <div className="text-sm text-yellow-600">Flawless Streak</div>
        </div>
      )}
    </div>
  );
};

const NavTabs: React.FC<NavTabsProps> = ({ currentPath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [user] = useAuthState(getAuth());

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuItems = [
    { href: "/", icon: Home, label: "Today", path: "/" },
    { href: "/archive", icon: Archive, label: "Archive", path: "/archive" },
    { href: "/patch-notes", icon: FileText, label: "Updates", path: "/patch-notes" },
    { href: "/about", icon: Info, label: "About", path: "/about" },
  ];

  return (
    <div className="mb-2">
      {/* Header with hamburger menu and title */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="p-2 text-white hover:bg-white/20"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
          
          {/* Fusdle Title */}
          <h1 className="text-2xl font-bold text-white">Fusdle</h1>
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {/* How to Play Dialog */}
          <Dialog open={showHowToPlay} onOpenChange={setShowHowToPlay}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-white/20">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  How to Play Fusdle
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">🎯 Goal</h3>
                  <p className="text-sm text-gray-600">Guess the word, phrase, or concept behind the emojis!</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🎮 How to Play</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Look at the emojis and think about what they represent</li>
                    <li>• Type your guess in the input field</li>
                    <li>• Get hints if you're stuck (but lose your flawless streak)</li>
                    <li>• Solve normal mode to unlock hard mode</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">✨ Features</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Daily puzzles with normal & hard difficulty</li>
                    <li>• Fusion twist puzzles twice a week</li>
                    <li>• Streak tracking and multipliers</li>
                    <li>• Share your results with friends</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Statistics Dialog */}
          <Dialog open={showStatistics} onOpenChange={setShowStatistics}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-white/20">
                <BarChart3 className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Your Statistics
                </DialogTitle>
              </DialogHeader>
              <StatisticsContent />
              <div className="text-center text-sm text-gray-500 mt-4">
                {!user ? "Sign in with Google to sync your progress across devices!" : "Your progress is automatically saved to your Google account"}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-lg z-50 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Fusdle
            </h2>
            <Button variant="ghost" size="sm" onClick={toggleMenu}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={toggleMenu}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      currentPath === item.path
                        ? "bg-purple-100 text-purple-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                </Link>
              );
            })}
            
            {/* User Menu in mobile */}
            <div className="pt-4 border-t">
              <UserMenu />
            </div>
          </div>
        </motion.div>
      )}

      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden lg:flex justify-center">
        <motion.nav 
          className="inline-flex bg-white/30 rounded-xl p-1.5 backdrop-blur-md shadow-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
        <Link href="/">
          <a
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-1.5 transition-all duration-200 ${
              currentPath === "/"
                ? "text-white bg-secondary shadow-md"
                : "text-white/90 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Today</span>
          </a>
        </Link>
        <Link href="/archive">
          <a
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-1.5 transition-all duration-200 ${
              currentPath === "/archive"
                ? "text-white bg-secondary shadow-md"
                : "text-white/90 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </a>
        </Link>
        <Link href="/patch-notes">
          <a
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-1.5 transition-all duration-200 ${
              currentPath === "/patch-notes"
                ? "text-white bg-secondary shadow-md"
                : "text-white/90 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Updates</span>
          </a>
        </Link>
        <Link href="/about">
          <a
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-1.5 transition-all duration-200 ${
              currentPath === "/about"
                ? "text-white bg-secondary shadow-md"
                : "text-white/90 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </a>
        </Link>
        </motion.nav>
      </div>

      {/* Desktop User Menu - Top right corner for large screens */}
      <div className="hidden lg:block fixed top-4 right-4 z-40">
        <UserMenu />
      </div>
    </div>
  );
};

export default NavTabs;
