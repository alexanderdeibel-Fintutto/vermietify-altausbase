import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function ActivityIndicator({ active = false, label = 'Aktiv' }) {
  return (
    <div className="inline-flex items-center gap-2">
      <motion.div
        animate={active ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className="relative"
      >
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
        {active && (
          <motion.div
            animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-green-500"
          />
        )}
      </motion.div>
      <span className={`text-xs font-medium ${active ? 'text-green-600' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}