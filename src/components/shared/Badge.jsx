import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Badge({ 
  label, 
  variant = 'default',
  onRemove,
  icon: Icon
}) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    primary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100'
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${variants[variant]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}