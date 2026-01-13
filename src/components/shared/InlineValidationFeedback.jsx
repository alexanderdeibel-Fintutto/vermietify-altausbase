import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InlineValidationFeedback({ validation, touched = false }) {
  if (!touched || !validation) return null;

  const { type = 'error', message } = validation;

  const config = {
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  };

  const { icon: Icon, color, bg, border } = config[type] || config.error;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={`flex items-start gap-2 p-2 rounded text-xs ${bg} border ${border}`}
        >
          <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
          <span className={`${color} font-medium`}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}