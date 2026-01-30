import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function EmptyStateWithAction({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>

      <div className="flex gap-3">
        {onAction && (
          <Button onClick={onAction} className="gap-2">
            {actionLabel}
          </Button>
        )}
        {onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}