import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2, Archive, Mail, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkActionsBar({ selectedCount, onClear, actions = [] }) {
  const defaultActions = [
    { id: 'delete', label: 'Löschen', icon: Trash2, variant: 'destructive' },
    { id: 'archive', label: 'Archivieren', icon: Archive, variant: 'secondary' },
    { id: 'email', label: 'E-Mail senden', icon: Mail, variant: 'secondary' },
    { id: 'tag', label: 'Tag hinzufügen', icon: Tag, variant: 'secondary' },
  ];

  const allActions = actions.length > 0 ? actions : defaultActions;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4"
        >
          <button onClick={onClear} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
          
          <span className="font-semibold">
            {selectedCount} ausgewählt
          </span>

          <div className="flex gap-2">
            {allActions.map(action => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.variant || 'secondary'}
                  onClick={action.onClick}
                  className="h-8"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}