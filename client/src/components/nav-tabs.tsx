import { Link } from "wouter";
import { motion } from "framer-motion";
import { Archive, Home, Info, FileText } from "lucide-react";
import UserMenu from "@/components/user-menu";

interface NavTabsProps {
  currentPath: string;
}

const NavTabs: React.FC<NavTabsProps> = ({ currentPath }) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex justify-between items-center w-full max-w-4xl">
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
        
        {/* User Menu */}
        <div className="ml-4">
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default NavTabs;
