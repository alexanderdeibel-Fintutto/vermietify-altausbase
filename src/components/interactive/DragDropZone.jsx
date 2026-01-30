import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DragDropZone({ onDrop, accept = '*', className = '' }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (onDrop) {
      onDrop(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
      } ${className}`}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center"
          >
            <Upload className="w-12 h-12 text-blue-600" />
          </motion.div>
        )}
      </AnimatePresence>

      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
      <p className="font-medium text-gray-700 dark:text-gray-300">
        Dateien hier ablegen
      </p>
      <p className="text-sm text-gray-500 mt-1">
        oder klicken zum Auswählen
      </p>
    </div>
  );
}