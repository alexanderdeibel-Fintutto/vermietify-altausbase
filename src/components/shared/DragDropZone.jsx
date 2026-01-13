import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DragDropZone({ 
  onFilesSelect,
  accept = '*',
  maxFiles = 1,
  multiple = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).slice(0, maxFiles);
    setFiles(droppedFiles);
    onFilesSelect?.(droppedFiles);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelect?.(updated);
  };

  return (
    <div className="space-y-3">
      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => {
            setFiles(Array.from(e.target.files));
            onFilesSelect?.(Array.from(e.target.files));
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-medium text-slate-700">Datei hier ablegen</p>
          <p className="text-xs text-slate-500">oder klicken zum Durchsuchen</p>
        </div>
      </motion.div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-slate-100 rounded text-xs">
              <span className="text-slate-700 truncate">{file.name}</span>
              <button
                onClick={() => removeFile(idx)}
                className="text-slate-500 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}