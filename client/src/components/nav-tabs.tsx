import { Link } from "wouter";
import { motion } from "framer-motion";
import { Archive, Home, Info, Database } from "lucide-react";

interface NavTabsProps {
  currentPath: string;
}

const NavTabs: React.FC<NavTabsProps> = ({ currentPath }) => {
  return (
    <div className="flex justify-center mb-6">
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
        <Link href="/storage-test">
          <a
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-1.5 transition-all duration-200 ${
              currentPath === "/storage-test"
                ? "text-white bg-secondary shadow-md"
                : "text-white/90 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Storage</span>
          </a>
        </Link>
      </motion.nav>
    </div>
  );
};

export default NavTabs;
