import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function KeyboardShortcutsHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K / Ctrl+K: Open Global Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const event = new CustomEvent('openGlobalSearch');
        window.dispatchEvent(event);
      }

      // Cmd+Shift+E / Ctrl+Shift+E: Export
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        const event = new CustomEvent('triggerExport');
        window.dispatchEvent(event);
      }

      // Cmd+N / Ctrl+N: New
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        const event = new CustomEvent('triggerNew');
        window.dispatchEvent(event);
      }

      // Cmd+, / Ctrl+,: Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        const event = new CustomEvent('openSettings');
        window.dispatchEvent(event);
      }

      // Cmd+R / Ctrl+R: Refresh (but allow browser default)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        // Only prevent if we have custom refresh logic
        // Otherwise let browser handle it
        queryClient.refetchQueries();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queryClient]);

  return null;
}