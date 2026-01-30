import React, { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContextualTip({ tip, storageKey, delay = 2000 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!storageKey) return;

    const dismissed = localStorage.getItem(`tip_${storageKey}`);
    if (!dismissed) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [storageKey, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (storageKey) {
      localStorage.setItem(`tip_${storageKey}`, 'true');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100">{tip}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}