import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Redo } from 'lucide-react';

export default function UndoRedoBar({ canUndo, canRedo, onUndo, onRedo }) {
  return (
    <div className="flex gap-2 items-center">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo className="h-4 w-4 mr-2" />
        Rückgängig
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
      >
        <Redo className="h-4 w-4 mr-2" />
        Wiederholen
      </Button>
    </div>
  );
}