import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function KeyboardShortcutsHint({ shortcuts = [] }) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="text-xs text-slate-500 space-y-1">
      {shortcuts.map((shortcut, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono">
            {shortcut.keys}
          </kbd>
          <span>{shortcut.description}</span>
        </div>
      ))}
    </div>
  );
}