import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function EmptyStateWithAction({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'default',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-slate-100">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-600 text-center mb-6 max-w-sm">
          {description}
        </p>
      )}

      {actionLabel && (
        <Button onClick={onAction} variant={actionVariant}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}