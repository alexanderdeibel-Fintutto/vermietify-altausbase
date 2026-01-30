import React from 'react';
import { motion } from 'framer-motion';

export default function HoverCard({ children, className = '' }) {
  return (
    <motion.div
      className={`hover-lift ${className}`}
      whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.div>
  );
}