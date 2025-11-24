import React from 'react';
import { motion } from 'framer-motion';

interface GenerationLoaderProps {
  step: string;
}

export const GenerationLoader: React.FC<GenerationLoaderProps> = ({ step }) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <motion.div
        className="flex items-center justify-center w-16 h-16 mb-4 bg-white rounded-full shadow-lg border-2 border-primary"
        animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span className="material-symbols-outlined text-3xl text-primary animate-pulse">smart_toy</span>
      </motion.div>

      <motion.h3
        key={step} // Re-animate when step changes
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-handwritten text-2xl font-bold text-off-black"
      >
        {step}
      </motion.h3>

      <div className="mt-2 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </div>
  );
};
