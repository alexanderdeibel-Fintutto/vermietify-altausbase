import React, { useState } from 'react';
import { Plus, FileText, Building2, Users, DollarSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_ACTIONS = [
  { id: 1, label: 'Gebäude', icon: Building2, color: 'bg-blue-500', action: 'create_building' },
  { id: 2, label: 'Mieter', icon: Users, color: 'bg-green-500', action: 'create_tenant' },
  { id: 3, label: 'Dokument', icon: FileText, color: 'bg-purple-500', action: 'upload_document' },
  { id: 4, label: 'Abrechnung', icon: DollarSign, color: 'bg-orange-500', action: 'create_statement' },
];

export default function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action) => {
    window.dispatchEvent(new CustomEvent('quickAction', { detail: { action } }));
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 space-y-3"
          >
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ opacity: 0, scale: 0, y: 10 }}
                  onClick={() => handleAction(action.action)}
                  className={`${action.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group relative`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        animate={{ rotate: isOpen ? 45 : 0 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}