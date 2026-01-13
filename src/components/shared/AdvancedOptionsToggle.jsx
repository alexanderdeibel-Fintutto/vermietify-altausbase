import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvancedOptionsToggle({
  title = 'Erweiterte Optionen',
  children,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setOpen(!open)}
        variant="outline"
        className="w-full justify-between"
      >
        <span className="text-sm font-medium">{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 border-l-2 border-slate-200 pl-4 py-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}