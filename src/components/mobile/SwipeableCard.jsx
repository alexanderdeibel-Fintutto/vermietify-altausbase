import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Edit } from 'lucide-react';

export default function SwipeableCard({ 
  children, 
  onDelete, 
  onEdit,
  deleteThreshold = 120 
}) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const backgroundColor = useTransform(
    x,
    [-deleteThreshold, 0],
    ['#ef4444', '#ffffff']
  );

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    if (info.offset.x < -deleteThreshold) {
      onDelete?.();
    }
    
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background actions */}
      <div className="absolute inset-y-0 right-0 flex items-center px-6 bg-red-500">
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x, backgroundColor }}
        className="relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}