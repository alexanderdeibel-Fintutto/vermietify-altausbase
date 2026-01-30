import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      className={`${sizes[size]} border-3 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full ${className}`}
    />
  );
}