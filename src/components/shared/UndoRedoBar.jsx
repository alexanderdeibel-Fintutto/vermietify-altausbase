import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UndoRedoBar({ 
  canUndo = false, 
  canRedo = false,
  onUndo,
  onRedo,
  isDirty = false
}) {
  if (!isDirty) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg"
    >
      <span className="text-xs text-amber-700 font-medium">Änderungen:</span>
      <Button
        onClick={onUndo}
        disabled={!canUndo}
        size="sm"
        variant="ghost"
        className="h-7 gap-1 disabled:opacity-50"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Undo</span>
      </Button>
      <Button
        onClick={onRedo}
        disabled={!canRedo}
        size="sm"
        variant="ghost"
        className="h-7 gap-1 disabled:opacity-50"
      >
        <RotateCw className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Redo</span>
      </Button>
    </motion.div>
  );
}