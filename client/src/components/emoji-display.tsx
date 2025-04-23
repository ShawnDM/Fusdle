import { motion } from "framer-motion";

interface EmojiDisplayProps {
  emojis: string[];
}

const EmojiDisplay: React.FC<EmojiDisplayProps> = ({ emojis }) => {
  return (
    <div className="flex justify-center my-6">
      <div className="text-6xl md:text-7xl flex space-x-3 animate-bounce-in">
        {emojis.map((emoji, index) => (
          <motion.span
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              delay: index * 0.1
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
    </div>
  );
};

export default EmojiDisplay;
