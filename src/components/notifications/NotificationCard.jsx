import React from 'react';
import { Bell, FileText, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const NOTIFICATION_TYPES = {
  info: { icon: Info, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  success: { icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
  warning: { icon: AlertCircle, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  error: { icon: AlertCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-600' },
  document: { icon: FileText, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' }
};

export default function NotificationCard({ notification, onClick, onDismiss }) {
  const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      className={`relative p-4 rounded-lg border transition-all cursor-pointer ${
        notification.is_read
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
      } hover:shadow-md`}
    >
      <div className="flex gap-3">
        <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.created_date), { 
              addSuffix: true, 
              locale: de 
            })}
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!notification.is_read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
      )}
    </motion.div>
  );
}