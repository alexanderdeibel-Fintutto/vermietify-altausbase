import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressIndicatorBar({
  current = 0,
  total = 100,
  label,
  showPercentage = true,
  color = 'bg-blue-600',
}) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showPercentage && (
            <span className="text-slate-600">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}