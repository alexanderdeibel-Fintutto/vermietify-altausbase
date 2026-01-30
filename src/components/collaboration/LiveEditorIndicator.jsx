import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Users } from 'lucide-react';

export default function LiveEditorIndicator({ activeUsers = [] }) {
  if (activeUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-8 z-40 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 flex items-center gap-2"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Eye className="w-4 h-4 text-green-600" />
      </motion.div>
      
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map((user, idx) => (
          <div
            key={user.id}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-semibold"
            title={user.name}
            style={{ zIndex: 10 - idx }}
          >
            {user.name?.charAt(0) || 'U'}
          </div>
        ))}
      </div>

      <span className="text-sm text-gray-700 dark:text-gray-300">
        {activeUsers.length > 3 ? `${activeUsers.length} Benutzer` : activeUsers.map(u => u.name).join(', ')}
      </span>
    </motion.div>
  );
}