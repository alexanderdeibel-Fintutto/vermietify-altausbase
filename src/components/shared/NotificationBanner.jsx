import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VARIANTS = {
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100', iconColor: 'text-blue-600' },
  success: { icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-900 dark:text-green-100', iconColor: 'text-green-600' },
  warning: { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-100', iconColor: 'text-amber-600' },
  error: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-100', iconColor: 'text-red-600' }
};

export default function NotificationBanner({ variant = 'info', title, message, onDismiss, action }) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${config.bg} ${config.border} border rounded-lg p-4`}
      >
        <div className="flex gap-3">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            {title && <h4 className={`font-semibold text-sm ${config.text} mb-1`}>{title}</h4>}
            <p className={`text-sm ${config.text}`}>{message}</p>
            {action && <div className="mt-3">{action}</div>}
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className={`${config.iconColor} hover:opacity-70 transition-opacity`}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}