import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RateLimitFeedback({ 
  remaining = null,
  limit = null,
  resetTime = null,
  show = false 
}) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!resetTime) return;

    const updateTimer = () => {
      const now = new Date();
      const reset = new Date(resetTime);
      const diff = Math.floor((reset - now) / 1000);

      if (diff <= 0) {
        setTimeLeft('');
      } else if (diff < 60) {
        setTimeLeft(`${diff}s`);
      } else {
        setTimeLeft(`${Math.floor(diff / 60)}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [resetTime]);

  const percentage = remaining && limit ? (remaining / limit) * 100 : 0;
  const isLow = percentage < 20;
  const isExceeded = remaining === 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
            isExceeded
              ? 'bg-red-50 border-red-200'
              : isLow
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          {isExceeded ? (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              isExceeded ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-blue-700'
            }`}>
              {isExceeded
                ? 'Rate Limit erreicht'
                : `${remaining} von ${limit} Anfragen verbleibend`}
            </p>
            {timeLeft && (
              <p className="text-xs text-slate-600">
                Zurückgesetzt in {timeLeft}
              </p>
            )}
          </div>

          {limit && (
            <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`h-full ${
                  isExceeded
                    ? 'bg-red-600'
                    : isLow
                    ? 'bg-amber-600'
                    : 'bg-blue-600'
                }`}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}