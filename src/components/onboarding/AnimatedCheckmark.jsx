import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function AnimatedCheckmark({ delay = 0 }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay, 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    </motion.div>
  );
}