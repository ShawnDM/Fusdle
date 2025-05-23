import { Link } from "wouter";
import { motion } from "framer-motion";
import { Archive, Home, Info, FileText, Menu, X, HelpCircle, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import UserMenu from "@/components/user-menu";

interface NavTabsProps {
  currentPath: string;
}

const NavTabs: React.FC<NavTabsProps> = ({ currentPath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Puzzles Solved</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Current Streak</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Max Streak</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">0%</div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500">
                  Sign in with Google to track your progress!
                </div>
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
