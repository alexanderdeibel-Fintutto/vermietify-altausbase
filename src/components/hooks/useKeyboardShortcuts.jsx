import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts = {}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + N: New
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        shortcuts.onNew?.();
      }
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        shortcuts.onSave?.();
      }
      // Ctrl/Cmd + F: Search/Filter
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        shortcuts.onSearch?.();
      }
      // Escape: Close
      if (e.key === 'Escape') {
        shortcuts.onEscape?.();
      }
      // Ctrl/Cmd + K: Command/Action Menu
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts.onCommand?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}