import React from 'react';
import { VfBadge } from './VfBadge';

export default function KeyboardShortcutsHint({ shortcuts = [] }) {
  const defaultShortcuts = [
    { key: '⌘K', action: 'Schnellsuche öffnen' },
    { key: '⌘N', action: 'Neues Element' },
    { key: 'ESC', action: 'Schließen' }
  ];

  const displayShortcuts = shortcuts.length > 0 ? shortcuts : defaultShortcuts;

  return (
    <div className="p-4 bg-[var(--theme-surface)] rounded-lg">
      <div className="text-xs font-semibold text-[var(--theme-text-muted)] mb-3 uppercase">
        Tastenkombinationen
      </div>
      <div className="space-y-2">
        {displayShortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm">{shortcut.action}</span>
            <VfBadge variant="default">
              <kbd className="font-mono text-xs">{shortcut.key}</kbd>
            </VfBadge>
          </div>
        ))}
      </div>
    </div>
  );
}