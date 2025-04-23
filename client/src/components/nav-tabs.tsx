import { Link } from "wouter";
import { motion } from "framer-motion";
import { Archive, Home, Info, Github, Twitter } from "lucide-react";

interface NavTabsProps {
  currentPath: string;
}

const NavTabs: React.FC<NavTabsProps> = ({ currentPath }) => {
  return (
    <>
      {/* Main navigation - enhanced with icons and animations */}
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
        </motion.nav>
      </div>
      
      {/* Social links fixed at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 z-10">
        <motion.div 
          className="flex gap-2 bg-white/30 backdrop-blur-md p-2 rounded-full shadow-md"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <motion.a 
            href="https://twitter.com/intent/tweet?text=I'm playing Fusdle! Can you solve the daily emoji puzzle? https://fusdle.app" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white w-10 h-10 rounded-full flex items-center justify-center text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white transition-colors duration-300 shadow-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Twitter className="w-5 h-5" />
          </motion.a>
          <motion.a 
            href="https://github.com/ShawnDM/Fusdle" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white w-10 h-10 rounded-full flex items-center justify-center text-[#333] hover:bg-[#333] hover:text-white transition-colors duration-300 shadow-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </>
  );
};

export default NavTabs;
