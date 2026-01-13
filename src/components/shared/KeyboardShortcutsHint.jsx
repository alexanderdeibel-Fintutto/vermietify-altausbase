import React from 'react';
import { Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KeyboardShortcutsHint({
  shortcuts = [],
  visible = true,
}) {
  return (
    <AnimatePresence>
      {visible && shortcuts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="p-3 rounded-lg bg-slate-50 border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-700 uppercase">
              Tastenkombinationen
            </span>
          </div>

          <div className="space-y-1">
            {shortcuts.map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{shortcut.description}</span>
                <kbd className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-mono">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}