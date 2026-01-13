import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutoSaveIndicator({ isSaving, isError, lastSaved }) {
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    if (lastSaved && !isSaving && !isError) {
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
    setShowStatus(true);
  }, [isSaving, isError, lastSaved]);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-xs font-medium"
        >
          {isSaving ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-600">Wird gespeichert...</span>
            </>
          ) : isError ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-600">Fehler beim Speichern</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600">Gespeichert</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}