import React, { useEffect } from 'react';

export default function KeyboardNavigationHelper({ enabled = true, onNavigate }) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e) => {
      // Alt + number for quick navigation
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        onNavigate(index);
      }

      // Arrow keys for list navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusable = Array.from(
          document.querySelectorAll('[data-keyboard-nav]:not([disabled])')
        );
        const currentIndex = focusable.indexOf(document.activeElement);

        if (currentIndex !== -1) {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowDown' 
            ? Math.min(currentIndex + 1, focusable.length - 1)
            : Math.max(currentIndex - 1, 0);
          focusable[nextIndex]?.focus();
        }
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        document.activeElement?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled, onNavigate]);

  return null;
}