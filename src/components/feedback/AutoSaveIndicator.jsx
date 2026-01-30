import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Save } from 'lucide-react';

export default function AutoSaveIndicator({ isSaving = false, lastSaved = null }) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!isSaving && lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaved]);

  return (
    <AnimatePresence>
      {isSaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <Save className="w-4 h-4" />
          </motion.div>
          <span>Speichert...</span>
        </motion.div>
      )}

      {showSaved && !isSaving && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 text-xs text-green-600"
        >
          <Check className="w-4 h-4" />
          <span>Gespeichert</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}