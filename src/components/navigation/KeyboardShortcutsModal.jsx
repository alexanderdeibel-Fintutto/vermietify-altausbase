import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { category: 'Navigation', shortcuts: [
    { keys: '⌘ K', description: 'Command Palette öffnen' },
    { keys: '⌘ /', description: 'Dieses Modal öffnen' },
  ]},
  { category: 'Allgemein', shortcuts: [
    { keys: '⌘ S', description: 'Speichern' },
    { keys: 'Esc', description: 'Schließen/Abbrechen' },
    { keys: 'Enter', description: 'Bestätigen' },
  ]},
  { category: 'Bearbeitung', shortcuts: [
    { keys: 'Tab', description: 'Nächstes Feld' },
    { keys: 'Shift + Tab', description: 'Vorheriges Feld' },
    { keys: '⌘ Z', description: 'Rückgängig' },
    { keys: '⌘ Shift Z', description: 'Wiederherstellen' },
  ]},
];

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Tastatur-Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="font-semibold text-sm uppercase text-gray-600 dark:text-gray-400 mb-4">
                {group.category}
              </h3>
              <div className="space-y-3">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Tipp: Drücke <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘ /</kbd> um diese Liste jederzeit anzuzeigen
        </p>
      </DialogContent>
    </Dialog>
  );
}