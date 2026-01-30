import React, { useEffect } from 'react';

export function useKeyboardShortcut(key, callback, ctrlKey = false, shiftKey = false) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        e.ctrlKey === ctrlKey &&
        e.shiftKey === shiftKey
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlKey, shiftKey]);
}

export default function KeyboardShortcutDisplay({ keys = [] }) {
  return (
    <div className="flex gap-1">
      {keys.map((k, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-gray-400 mx-1">+</span>}
          <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
            {k}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  );
}