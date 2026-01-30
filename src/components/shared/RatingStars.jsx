import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RatingStars({ rating, maxRating = 5, size = 'md', interactive = false, onRate }) {
  const sizeMap = { sm: 4, md: 5, lg: 6 };
  const iconSize = sizeMap[size];

  return (
    <div className="flex gap-1">
      {Array.from({ length: maxRating }).map((_, idx) => {
        const isActive = idx < Math.round(rating);
        return (
          <motion.button
            key={idx}
            whileHover={interactive ? { scale: 1.2 } : {}}
            onClick={() => interactive && onRate?.(idx + 1)}
            disabled={!interactive}
            className="focus:outline-none"
          >
            <Star
              size={iconSize}
              className={`transition-all ${
                isActive
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              } ${interactive ? 'cursor-pointer' : ''}`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}