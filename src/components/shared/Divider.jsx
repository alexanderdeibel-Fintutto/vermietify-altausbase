import React from 'react';

export default function Divider({ vertical = false, className = '' }) {
  return vertical ? (
    <div className={`w-px bg-gray-200 dark:bg-gray-700 ${className}`} />
  ) : (
    <div className={`h-px bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}