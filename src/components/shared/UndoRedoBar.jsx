import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function UndoRedoBar({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  visible = true,
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex gap-2 p-2 bg-slate-100 rounded-lg"
        >
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="ghost"
            size="sm"
            title="Rückgängig (Ctrl+Z)"
            className="gap-2"
          >
            <Undo2 className="w-4 h-4" />
            Rückgängig
          </Button>

          <div className="w-px bg-slate-300" />

          <Button
            onClick={onRedo}
            disabled={!canRedo}
            variant="ghost"
            size="sm"
            title="Wiederherstellen (Ctrl+Y)"
            className="gap-2"
          >
            <Redo2 className="w-4 h-4" />
            Wiederherstellen
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}