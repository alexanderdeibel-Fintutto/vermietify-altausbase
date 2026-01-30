import React from 'react';
import { motion } from 'framer-motion';

export default function ToggleGroup({ options = [], value, onChange, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <div className="inline-flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      {options.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative ${sizeClasses[size]} font-medium rounded transition-colors ${
            value === option.value
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400'
          }`}
          whileHover={{ y: -2 }}
        >
          {value === option.value && (
            <motion.div
              layoutId="toggle-bg"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded -z-10"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          {option.label}
        </motion.button>
      ))}
    </div>
  );
}