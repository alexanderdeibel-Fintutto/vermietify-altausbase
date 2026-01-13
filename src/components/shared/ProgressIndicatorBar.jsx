import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressIndicatorBar({ 
  current = 0, 
  total = 100,
  label = '',
  showPercentage = true,
  animated = true
}) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-1.5">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-slate-700 font-medium">{label}</span>}
          {showPercentage && <span className="text-slate-500">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.3, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
}