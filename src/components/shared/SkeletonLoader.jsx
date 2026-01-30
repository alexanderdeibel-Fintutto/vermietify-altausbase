import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonLoader({ count = 3, type = 'card' }) {
  const shimmer = {
    initial: { backgroundPosition: '200% 0' },
    animate: { backgroundPosition: '-200% 0' },
    transition: { repeat: Infinity, duration: 2, ease: 'linear' }
  };

  const cardSkeleton = (
    <motion.div
      {...shimmer}
      className="h-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg"
      style={{ backgroundSize: '200% 100%' }}
    />
  );

  const lineSkeleton = (
    <motion.div
      {...shimmer}
      className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded"
      style={{ backgroundSize: '200% 100%' }}
    />
  );

  const skeleton = type === 'card' ? cardSkeleton : lineSkeleton;

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx}>{skeleton}</div>
      ))}
    </div>
  );
}