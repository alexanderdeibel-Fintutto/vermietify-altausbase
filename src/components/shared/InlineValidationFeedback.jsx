import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InlineValidationFeedback({ 
  type = 'error', 
  message, 
  show = true 
}) {
  const config = {
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    }
  };

  const { icon: Icon, color, bg, border } = config[type];

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`flex items-start gap-2 p-2 rounded-md border ${bg} ${border} mt-1`}
        >
          <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
          <p className={`text-xs ${color}`}>{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}