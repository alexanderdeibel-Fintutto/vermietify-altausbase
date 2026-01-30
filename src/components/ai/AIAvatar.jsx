import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIAvatar({ size = 'md', animated = false }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      animate={animated ? { scale: [1, 1.1, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
      className={`${sizes[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg`}
    >
      <Bot className="w-1/2 h-1/2 text-white" />
    </motion.div>
  );
}