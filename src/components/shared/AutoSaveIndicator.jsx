import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function AutoSaveIndicator({ 
  status = 'idle', // 'idle' | 'saving' | 'saved' | 'error'
  lastSaved = null 
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'saving' || status === 'saved' || status === 'error') {
      setVisible(true);
    }

    if (status === 'saved') {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const config = {
    saving: {
      icon: Loader2,
      text: 'Speichern...',
      color: 'text-slate-500',
      spin: true
    },
    saved: {
      icon: CheckCircle2,
      text: 'Gespeichert',
      color: 'text-emerald-600',
      spin: false
    },
    error: {
      icon: CloudOff,
      text: 'Fehler',
      color: 'text-red-600',
      spin: false
    },
    idle: {
      icon: Cloud,
      text: '',
      color: 'text-slate-400',
      spin: false
    }
  };

  const { icon: Icon, text, color, spin } = config[status];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-xs"
        >
          <Icon className={`w-4 h-4 ${color} ${spin ? 'animate-spin' : ''}`} />
          <span className={color}>{text}</span>
          {lastSaved && status === 'saved' && (
            <span className="text-slate-400">
              ({new Date(lastSaved).toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })})
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}