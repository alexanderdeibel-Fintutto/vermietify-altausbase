import React, { useState } from 'react';
import { Upload, FileIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DragDropZone({
  onFilesSelected,
  accept = '.pdf,.doc,.docx',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
  };

  const processFiles = (fileList) => {
    const newErrors = [];
    const validFiles = [];

    Array.from(fileList).forEach((file) => {
      if (file.size > maxSize) {
        newErrors.push(`${file.name}: Datei zu groß`);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      animate={{ scale: isDragging ? 1.02 : 1 }}
      className={`relative p-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
      }`}
    >
      <input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center gap-2">
        <Upload className="w-8 h-8 text-slate-400" />
        <p className="font-medium text-slate-700">Dateien hier ablegen</p>
        <p className="text-sm text-slate-500">oder klicken zum Auswählen</p>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}