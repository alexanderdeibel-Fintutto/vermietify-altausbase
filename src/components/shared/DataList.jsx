import React from 'react';
import { motion } from 'framer-motion';

export default function DataList({ items = [], renderItem, emptyText = 'Keine Daten' }) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {items.length > 0 ? (
        items.map((item, idx) => (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            {renderItem(item)}
          </motion.div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {emptyText}
        </div>
      )}
    </div>
  );
}