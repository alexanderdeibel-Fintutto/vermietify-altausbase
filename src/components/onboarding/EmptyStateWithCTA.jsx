import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function EmptyStateWithCTA({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  illustration 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {illustration ? (
        <img src={illustration} alt={title} className="w-64 h-64 mb-6 opacity-80" />
      ) : Icon ? (
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-gray-400" />
        </div>
      ) : null}

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>

      {onAction && (
        <Button onClick={onAction} size="lg" className="bg-blue-600 hover:bg-blue-700">
          {actionLabel || 'Los geht\'s'}
        </Button>
      )}
    </motion.div>
  );
}