import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonLoader({ count = 3, variant = 'card' }) {
  const skeletons = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="space-y-4">
        {skeletons.map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="p-4 bg-slate-200 rounded-lg"
          >
            <div className="space-y-3">
              <div className="h-4 bg-slate-300 rounded w-3/4"></div>
              <div className="h-3 bg-slate-300 rounded w-full"></div>
              <div className="h-3 bg-slate-300 rounded w-5/6"></div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-2">
        {skeletons.map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex gap-4 p-4 bg-slate-100 rounded-lg"
          >
            <div className="h-4 bg-slate-300 rounded flex-1"></div>
            <div className="h-4 bg-slate-300 rounded w-20"></div>
            <div className="h-4 bg-slate-300 rounded w-20"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}