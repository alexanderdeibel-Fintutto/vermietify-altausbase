import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      for (const shortcut of shortcuts) {
        const { keys, callback, ctrlKey = false, shiftKey = false, altKey = false } = shortcut;

        if (
          e.key.toLowerCase() === keys.toLowerCase() &&
          e.ctrlKey === ctrlKey &&
          e.shiftKey === shiftKey &&
          e.altKey === altKey
        ) {
          e.preventDefault();
          callback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export const COMMON_SHORTCUTS = {
  SAVE: { keys: 's', ctrlKey: true },
  SEARCH: { keys: 'k', ctrlKey: true },
  ESC: { keys: 'Escape' },
  ENTER: { keys: 'Enter' },
  DELETE: { keys: 'Delete' }
};