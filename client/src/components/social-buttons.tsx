import { motion } from "framer-motion";

const SocialButtons = () => {
  return (
    <div className="w-full flex justify-center mt-8 mb-4">
      <motion.div 
        className="flex gap-3 bg-white/30 backdrop-blur-md p-2.5 rounded-full shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.a 
          href="https://x.com/shawndean_" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/90 w-11 h-11 rounded-full flex items-center justify-center text-gray-800 hover:bg-[#1da1f2] hover:text-white transition-colors duration-300 shadow-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Twitter/X"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </motion.a>
        <motion.a 
          href="https://ko-fi.com/shawndean" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/90 w-11 h-11 rounded-full flex items-center justify-center text-[#FF5E5B] hover:bg-[#FF5E5B] hover:text-white transition-colors duration-300 shadow-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Ko-fi"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
          </svg>
        </motion.a>
      </motion.div>
    </div>
  );
};

export default SocialButtons;