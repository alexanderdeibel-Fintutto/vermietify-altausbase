import React, { useState } from 'react';
import { Upload, FileIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DragDropZone({
  onFilesSelected,
  accept = '*',
  maxSize = 10 * 1024 * 1024,
  multiple = true,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFiles = (filesToCheck) => {
    for (let file of filesToCheck) {
      if (file.size > maxSize) {
        setError(`${file.name} ist zu groß (max ${maxSize / 1024 / 1024}MB)`);
        return false;
      }
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (!multiple && droppedFiles.length > 1) {
      setError('Nur eine Datei erlaubt');
      return;
    }

    if (validateFiles(droppedFiles)) {
      setFiles(multiple ? [...files, ...droppedFiles] : droppedFiles);
      setError('');
      onFilesSelected?.(multiple ? [...files, ...droppedFiles] : droppedFiles);
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelected?.(updated);
  };

  return (
    <div className="space-y-3">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? 'rgb(59, 130, 246)' : 'rgb(226, 232, 240)',
          backgroundColor: isDragging ? 'rgb(239, 246, 255)' : 'rgb(248, 250, 252)',
        }}
        className="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Datei hierher ziehen</p>
        <p className="text-xs text-slate-500 mt-1">oder klicken zum Durchsuchen</p>
      </motion.div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-700 truncate">{file.name}</span>
                <span className="text-xs text-slate-500">
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}