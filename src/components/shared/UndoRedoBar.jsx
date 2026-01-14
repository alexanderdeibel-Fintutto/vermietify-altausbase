import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

class HistoryManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
  }

  push(state) {
    // Remove any future states if we're in the middle
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    this.history.push({
      state,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.history[this.currentIndex].state;
    }
    return null;
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex].state;
    }
    return null;
  }

  reset() {
    this.history = [];
    this.currentIndex = -1;
  }
}

export function useUndoRedo(initialState) {
  const [state, setState] = useState(initialState);
  const [manager] = useState(() => new HistoryManager());

  const saveState = (newState) => {
    manager.push(newState);
    setState(newState);
  };

  const undo = () => {
    const previousState = manager.undo();
    if (previousState) {
      setState(previousState);
      return previousState;
    }
  };

  const redo = () => {
    const nextState = manager.redo();
    if (nextState) {
      setState(nextState);
      return nextState;
    }
  };

  const reset = () => {
    manager.reset();
    setState(initialState);
  };

  return {
    state,
    saveState,
    undo,
    redo,
    canUndo: manager.canUndo(),
    canRedo: manager.canRedo(),
    reset
  };
}

export default function UndoRedoBar({ 
  canUndo = false, 
  canRedo = false, 
  onUndo, 
  onRedo,
  onReset,
  show = true 
}) {
  if (!show) return null;

  return (
    <AnimatePresence>
      {(canUndo || canRedo) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-6 z-40"
        >
          <Card className="shadow-lg">
            <div className="flex items-center gap-2 p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                title="Rückgängig (Strg+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                title="Wiederherstellen (Strg+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>

              {onReset && (canUndo || canRedo) && (
                <>
                  <div className="w-px h-6 bg-slate-200" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    title="Zurücksetzen"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}