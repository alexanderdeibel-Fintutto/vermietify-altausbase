import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonLoader({
  count = 3,
  type = 'card', // card, text, table
  height = 'h-12',
}) {
  const shimmer = {
    animate: {
      backgroundPosition: ['0% 0%', '100% 0%'],
    },
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return Array.from({ length: count }).map((_, idx) => (
          <motion.div
            key={idx}
            variants={shimmer}
            animate="animate"
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`${height} bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded mb-3`}
            style={{
              backgroundSize: '200% 100%',
            }}
          />
        ));

      case 'table':
        return Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, colIdx) => (
              <motion.div
                key={colIdx}
                variants={shimmer}
                animate="animate"
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex-1 h-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded"
                style={{
                  backgroundSize: '200% 100%',
                }}
              />
            ))}
          </div>
        ));

      default: // card
        return Array.from({ length: count }).map((_, idx) => (
          <motion.div
            key={idx}
            variants={shimmer}
            animate="animate"
            transition={{ duration: 1.5, repeat: Infinity }}
            className="p-4 rounded-lg border border-slate-200 mb-4"
          >
            <div
              className="h-6 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded mb-3"
              style={{
                backgroundSize: '200% 100%',
              }}
            />
            <div
              className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded"
              style={{
                backgroundSize: '200% 100%',
              }}
            />
          </motion.div>
        ));
    }
  };

  return <div>{renderSkeleton()}</div>;
}