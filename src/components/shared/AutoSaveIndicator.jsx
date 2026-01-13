import React, { useEffect, useState } from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutoSaveIndicator({
  status = 'idle',
  lastSavedTime = null,
  showTime = true,
}) {
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    if (!lastSavedTime || !showTime) return;

    const updateTime = () => {
      const now = new Date();
      const diff = Math.floor((now - new Date(lastSavedTime)) / 1000);

      if (diff < 60) {
        setDisplayTime('gerade eben');
      } else if (diff < 3600) {
        setDisplayTime(`vor ${Math.floor(diff / 60)} Min.`);
      } else {
        setDisplayTime(`vor ${Math.floor(diff / 3600)} Std.`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [lastSavedTime, showTime]);

  const configs = {
    idle: { icon: Clock, color: 'text-slate-400', label: 'Speichern...' },
    saving: { icon: Clock, color: 'text-blue-500', label: 'Speichern...' },
    saved: { icon: Check, color: 'text-emerald-600', label: 'Gespeichert' },
    error: { icon: AlertCircle, color: 'text-red-500', label: 'Fehler beim Speichern' },
  };

  const config = configs[status] || configs.idle;
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`flex items-center gap-1.5 text-xs ${config.color}`}
      >
        {status === 'saving' ? (
          <Icon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Icon className="w-3.5 h-3.5" />
        )}
        <span>
          {config.label}
          {displayTime && ` • ${displayTime}`}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}