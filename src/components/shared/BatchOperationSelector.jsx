import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BatchOperationSelector({ 
  items = [], 
  onSelectionChange,
  actions = []
}) {
  const [selected, setSelected] = useState(new Set());

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(item => item.id)));
    }
  };

  const toggleItem = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selected.size} ausgewählt
            </span>
            <div className="flex gap-2">
              {actions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={idx}
                    size="sm"
                    variant={action.variant || 'outline'}
                    onClick={() => action.onClick(Array.from(selected))}
                    className="gap-2"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Checkbox
            checked={selected.size === items.length && items.length > 0}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Alle auswählen
          </span>
        </div>

        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
            <Checkbox
              checked={selected.has(item.id)}
              onCheckedChange={() => toggleItem(item.id)}
            />
            <div className="flex-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}