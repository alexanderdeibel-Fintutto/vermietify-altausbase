import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvancedOptionsToggle({ children, label = 'Erweiterte Optionen' }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setExpanded(!expanded)}
        variant="ghost"
        size="sm"
        className="h-8 text-slate-600 hover:text-slate-900 gap-2 text-xs sm:text-sm"
      >
        <Settings className="w-4 h-4" />
        {label}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}