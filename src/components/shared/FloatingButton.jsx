import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function FloatingButton({ 
  icon: Icon, 
  label, 
  onClick,
  position = 'bottom-right'
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-40`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={onClick}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl gap-2"
        title={label}
      >
        <Icon className="w-6 h-6" />
      </Button>
    </motion.div>
  );
}