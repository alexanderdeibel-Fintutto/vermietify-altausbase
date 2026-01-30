import React from 'react';
import { motion } from 'framer-motion';

export default function PulseEffect({ children, intensity = 0.5 }) {
  return (
    <motion.div
      animate={{ opacity: [1, 1 - intensity, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      {children}
    </motion.div>
  );
}