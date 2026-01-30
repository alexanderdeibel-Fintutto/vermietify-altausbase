import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function FloatingToolbar({ visible, actions = [], position = 'bottom' }) {
  const positions = {
    top: 'top-8',
    bottom: 'bottom-8',
    topRight: 'top-8 right-8',
    bottomRight: 'bottom-8 right-8'
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: position.includes('bottom') ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position.includes('bottom') ? 20 : -20 }}
          className={`fixed ${positions[position] || positions.bottom} bg-white dark:bg-gray-800 shadow-xl rounded-lg p-2 flex gap-2 border border-gray-200 dark:border-gray-700 z-30`}
        >
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Button
                key={idx}
                variant={action.variant || 'ghost'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="gap-2"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {action.label}
              </Button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}