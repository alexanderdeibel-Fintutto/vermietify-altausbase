import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function SwipeableCard({ children, onDelete }) {
  const [dragX, setDragX] = useState(0);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-20 bg-[var(--vf-error-500)] flex items-center justify-center">
        <Trash2 className="h-5 w-5 text-white" />
      </div>
      
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDrag={(e, info) => setDragX(info.offset.x)}
        onDragEnd={(e, info) => {
          if (info.offset.x < -60 && onDelete) {
            onDelete();
          }
        }}
        className="bg-white relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}