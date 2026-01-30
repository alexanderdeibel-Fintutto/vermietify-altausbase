import React from 'react';
import { motion } from 'framer-motion';

export default function Progress({ value = 0, max = 100, showLabel = false, color = 'blue' }) {
  const percentage = (value / max) * 100;

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    amber: 'bg-amber-600'
  };

  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${colors[color]}`}
        />
      </div>
      {showLabel && (
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}