import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartBulkActionsBar({ selectedCount = 0, actions = [], onClose }) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="sticky top-16 z-30 bg-slate-800 text-white p-3 sm:p-4 flex items-center justify-between gap-2 rounded-lg shadow-lg"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <span className="text-sm font-medium">{selectedCount} ausgewählt</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action) => (
          <Button
            key={action.id}
            onClick={() => {
              action.onClick?.();
              onClose?.();
            }}
            size="sm"
            className="bg-slate-700 hover:bg-slate-600 gap-1 text-xs sm:text-sm h-8 px-2 sm:px-3"
            variant="ghost"
          >
            {action.icon && <action.icon className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
}