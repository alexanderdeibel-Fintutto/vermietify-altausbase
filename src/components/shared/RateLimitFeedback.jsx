import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RateLimitFeedback({ 
  isRateLimited = false,
  remainingSeconds = 0,
  message = 'Zu viele Anfragen. Bitte warten Sie einen Moment.'
}) {
  const [seconds, setSeconds] = useState(remainingSeconds);

  useEffect(() => {
    if (!isRateLimited) return;

    setSeconds(remainingSeconds);
    const interval = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRateLimited, remainingSeconds]);

  if (!isRateLimited) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg"
    >
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-900 font-medium">{message}</p>
        {seconds > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span className="text-xs text-amber-700">
              Versuchen Sie es in {seconds} Sekunde{seconds !== 1 ? 'n' : ''} erneut
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}