import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompactTable({ data = [], columns = [], onRowClick }) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {data.map((row, idx) => (
        <motion.div
          key={row.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: idx * 0.03 }}
          onClick={() => onRowClick && onRowClick(row)}
          className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            onRowClick ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className={colIdx === 0 ? 'mb-1' : 'text-sm text-gray-600 dark:text-gray-400'}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </div>
              ))}
            </div>
            {onRowClick && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </div>
        </motion.div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
          Keine Daten vorhanden
        </div>
      )}
    </div>
  );
}