import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function KeyboardShortcutsHint({ shortcut, description }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-xs text-slate-500"
    >
      <span>{description}</span>
      <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono text-xs">
        {shortcut}
      </Badge>
    </motion.div>
  );
}