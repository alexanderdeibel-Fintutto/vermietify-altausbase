import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2 } from 'lucide-react';

export default function UndoRedoBar({ 
  canUndo = false, 
  canRedo = false,
  onUndo,
  onRedo 
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)]">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        title="Rückgängig"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        title="Wiederholen"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}