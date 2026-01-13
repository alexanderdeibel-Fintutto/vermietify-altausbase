import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], desc: 'Global Search öffnen' },
  { keys: ['⌘', 'Shift', 'E'], desc: 'Exportieren' },
  { keys: ['⌘', 'N'], desc: 'Neu erstellen' },
  { keys: ['⌘', ','], desc: 'Einstellungen' },
];

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  // Show help on ?
  if (typeof window !== 'undefined') {
    document.addEventListener('keydown', (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setOpen(true);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>⌨️ Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <Badge key={j} variant="outline" className="font-mono text-xs">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-3 border-t text-xs text-slate-500">
            Drücke <Badge variant="outline" className="font-mono text-xs">?</Badge> jederzeit für diese Übersicht
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}