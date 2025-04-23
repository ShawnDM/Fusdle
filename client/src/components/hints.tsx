import { motion } from "framer-motion";

interface HintsProps {
  hints: string[];
}

const Hints: React.FC<HintsProps> = ({ hints }) => {
  if (hints.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {hints.map((hint, index) => (
        <motion.div
          key={index}
          className="bg-accent/20 rounded-lg p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex">
            <span className="font-medium mr-2">Hint {index + 1}:</span>
            <span>{hint}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Hints;
