import React from 'react';

export default function SectionDivider({ label }) {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      {label && (
        <div className="relative flex justify-center">
          <span className="px-3 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}