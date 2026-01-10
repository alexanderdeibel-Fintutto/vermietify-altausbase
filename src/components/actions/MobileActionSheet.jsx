import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, Camera, FileText, X } from 'lucide-react';

const MOBILE_ACTIONS = [
  { id: 'voice', icon: Mic, label: 'Sprechen', gradient: 'from-blue-500 to-blue-600' },
  { id: 'photo', icon: Camera, label: 'Foto', gradient: 'from-green-500 to-green-600' },
  { id: 'document', icon: FileText, label: 'Beleg', gradient: 'from-purple-500 to-purple-600' }
];

export default function MobileActionSheet({ onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white rounded-t-3xl w-full p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Was möchten Sie tun?</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {MOBILE_ACTIONS.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => {
                  onSelect(action.id);
                  onClose();
                }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}