import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingActionMenu({ actions = [] }) {
  const [open, setOpen] = useState(false);

  if (actions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col gap-2"
          >
            {actions.map((action, idx) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Button
                  onClick={() => {
                    action.onClick?.();
                    setOpen(false);
                  }}
                  className={`${action.className || 'bg-blue-600 hover:bg-blue-700'} gap-2 shadow-lg`}
                  size="sm"
                >
                  {action.icon && <action.icon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setOpen(!open)}
        className="bg-slate-900 hover:bg-slate-800 rounded-full w-12 h-12 p-0 shadow-lg"
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>
    </div>
  );
}