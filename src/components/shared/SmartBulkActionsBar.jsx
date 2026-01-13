import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartBulkActionsBar({
  selectedCount = 0,
  onDelete,
  onDuplicate,
  onExport,
  onClear,
  loading = false,
}) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg shadow-lg z-40"
      >
        <span className="text-sm font-medium">
          {selectedCount} ausgewählt
        </span>

        <div className="w-px h-6 bg-slate-700" />

        <Button
          onClick={onDuplicate}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-slate-800 gap-2"
        >
          <Copy className="w-4 h-4" />
          Duplizieren
        </Button>

        <Button
          onClick={onExport}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-slate-800 gap-2"
        >
          <Download className="w-4 h-4" />
          Exportieren
        </Button>

        <Button
          onClick={onDelete}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:bg-red-900/20 gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Löschen
        </Button>

        <Button
          onClick={onClear}
          disabled={loading}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}