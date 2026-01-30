import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock } from 'lucide-react';

export default function TimeAgo({ date, prefix = '', showIcon = false, updateInterval = 60000 }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  if (!date) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
      {showIcon && <Clock className="w-3 h-3" />}
      {prefix && <span>{prefix}</span>}
      {formatDistanceToNow(new Date(date), { addSuffix: true, locale: de })}
    </span>
  );
}