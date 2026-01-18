import React from 'react';
import { Command } from 'lucide-react';

export default function KeyboardShortcutsHint({ shortcut, description }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
      <Command className="h-3 w-3" />
      <kbd className="px-2 py-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded text-xs">
        {shortcut}
      </kbd>
      <span>{description}</span>
    </div>
  );
}