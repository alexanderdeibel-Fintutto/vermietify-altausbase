import React from 'react';

export default function KeyboardShortcutsHint({ 
  shortcuts = [],
  position = 'bottom-right' 
}) {
  const positions = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
  };

  return (
    <div className={`fixed ${positions[position]} text-xs text-slate-500 space-y-1 z-40`}>
      {shortcuts.map((shortcut, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-slate-400">⌨️</span>
          <span>
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200 font-mono">
              {shortcut.keys}
            </kbd>
            {' '}
            <span className="text-slate-600">{shortcut.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}