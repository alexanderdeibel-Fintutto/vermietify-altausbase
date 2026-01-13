import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastNotificationCenter({
  notifications = [],
  onDismiss,
  maxNotifications = 3,
}) {
  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ notification, onDismiss }) {
  useEffect(() => {
    if (notification.duration !== Infinity) {
      const timer = setTimeout(
        () => onDismiss?.(notification.id),
        notification.duration || 5000
      );
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  const iconConfig = {
    success: { icon: CheckCircle2, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    error: { icon: AlertTriangle, color: 'bg-red-50 border-red-200 text-red-700' },
    warning: { icon: AlertCircle, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    info: { icon: Info, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  };

  const config = iconConfig[notification.type] || iconConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className={`flex items-start gap-3 p-4 rounded-lg border ${config.color}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        {notification.title && (
          <p className="font-medium mb-1">{notification.title}</p>
        )}
        {notification.message && (
          <p className="text-sm opacity-90">{notification.message}</p>
        )}
      </div>

      <button
        onClick={() => onDismiss?.(notification.id)}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}