import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InlineValidationFeedback({
  type = 'info', // info, success, error, warning
  message,
  visible = true,
  icon: CustomIcon = null,
}) {
  const config = {
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  };

  const { icon: Icon, color, bg } = config[type];
  const DisplayIcon = CustomIcon || Icon;

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`flex items-start gap-2 p-3 rounded-lg ${bg}`}
        >
          <DisplayIcon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
          <p className={`text-sm ${color}`}>{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}