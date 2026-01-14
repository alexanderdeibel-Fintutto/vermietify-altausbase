import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RateLimitFeedback({ 
  current,
  limit,
  resetTime,
  warningThreshold = 0.8
}) {
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const percentage = (current / limit) * 100;
  const isWarning = percentage >= warningThreshold * 100;

  useEffect(() => {
    if (!resetTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const reset = new Date(resetTime).getTime();
      const diff = reset - now;

      if (diff <= 0) {
        setTimeUntilReset('Jetzt zurückgesetzt');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeUntilReset(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [resetTime]);

  if (!limit || current === undefined) return null;

  return (
    <AnimatePresence>
      {isWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Alert variant="warning" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="ml-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-900 font-medium">
                    API Rate Limit
                  </span>
                  <span className="text-amber-700">
                    {current} / {limit} Anfragen
                  </span>
                </div>
                
                <Progress 
                  value={percentage} 
                  className="h-2"
                  indicatorClassName={percentage >= 100 ? 'bg-red-500' : 'bg-amber-500'}
                />
                
                {resetTime && (
                  <div className="flex items-center gap-2 text-xs text-amber-700">
                    <Clock className="w-3 h-3" />
                    <span>Zurücksetzung in: {timeUntilReset}</span>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}