import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Tags({ tags = [], onRemove, onAdd, editable = false }) {
  const [input, setInput] = React.useState('');

  const handleAdd = () => {
    if (input.trim()) {
      onAdd?.(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, idx) => (
        <motion.div
          key={idx}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2"
        >
          {tag}
          {editable && (
            <button onClick={() => onRemove?.(idx)} className="hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      ))}
      {editable && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Tag eingeben..."
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm"
        />
      )}
    </div>
  );
}