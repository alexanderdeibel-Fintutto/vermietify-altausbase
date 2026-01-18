import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Building, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Building, label: 'Objekt', color: 'bg-blue-500' },
    { icon: Users, label: 'Mieter', color: 'bg-green-500' },
    { icon: FileText, label: 'Vertrag', color: 'bg-purple-500' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4 space-y-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm font-medium bg-white px-3 py-1 rounded-lg shadow-md">
                  {action.label}
                </span>
                <button className={`${action.color} text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="gradient"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-xl"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}