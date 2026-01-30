import React from 'react';
import { motion } from 'framer-motion';

export default function Skeleton({ width = 'w-full', height = 'h-4', count = 1, className = '' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <motion.div
          key={idx}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`${width} ${height} bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        />
      ))}
    </div>
  );
}