import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PillButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'outline',
  size = 'md'
}) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={onClick}
        variant={variant}
        size={size}
        className="rounded-full gap-2"
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </Button>
    </motion.div>
  );
}