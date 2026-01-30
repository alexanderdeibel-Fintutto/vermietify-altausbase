import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Archive } from 'lucide-react';

export default function SwipeableCard({ children, onSwipeLeft, onSwipeRight }) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-150, 0, 150],
    ['#ef4444', '#ffffff', '#22c55e']
  );

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -100 && onSwipeLeft) {
      onSwipeLeft();
    } else if (info.offset.x > 100 && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      <div className="absolute inset-0 flex justify-between items-center px-4">
        <Archive className="w-5 h-5 text-green-600" />
        <Trash2 className="w-5 h-5 text-red-600" />
      </div>

      {/* Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, background }}
        className="relative cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}