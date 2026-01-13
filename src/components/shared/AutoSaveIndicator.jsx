import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AutoSaveIndicator({
  status = 'idle', // idle, saving, saved, error
  lastSavedAt = null,
  errorMessage = null,
}) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (status === 'saved') {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const getContent = () => {
    switch (status) {
      case 'saving':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="flex items-center gap-2 text-sm text-slate-600"
          >
            <Clock className="w-4 h-4" />
            <span>Wird gespeichert...</span>
          </motion.div>
        );
      case 'saved':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-sm text-emerald-600"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Gespeichert</span>
          </motion.div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage || 'Fehler beim Speichern'}</span>
          </div>
        );
      default:
        return lastSavedAt ? (
          <span className="text-xs text-slate-500">
            Zuletzt gespeichert: {lastSavedAt.toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ) : null;
    }
  };

  return (
    <div className="flex items-center justify-end">
      {getContent()}
    </div>
  );
}