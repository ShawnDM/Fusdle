import { Link } from "wouter";
import { motion } from "framer-motion";
import { Archive, Home, Info, FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu";

interface NavTabsProps {
  currentPath: string;
}

const NavTabs: React.FC<NavTabsProps> = ({ currentPath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuItems = [
    { href: "/", icon: Home, label: "Today", path: "/" },
    { href: "/archive", icon: Archive, label: "Archive", path: "/archive" },
    { href: "/patch-notes", icon: FileText, label: "Updates", path: "/patch-notes" },
    { href: "/about", icon: Info, label: "About", path: "/about" },
  ];

  return (
    <div className="mb-6">
      {/* Header with logo and hamburger menu */}
      <div className="flex justify-between items-center mb-4">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Fusdle
          </h1>
        </div>
        
        {/* Hamburger Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          className="p-2"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg rounded-b-2xl z-50 p-6 border-b"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Menu</h2>
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
