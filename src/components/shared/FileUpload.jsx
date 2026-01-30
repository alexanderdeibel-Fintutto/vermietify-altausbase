import React from 'react';
import { Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FileUpload({ onFileSelect, accept = '*', maxSize = 10 * 1024 * 1024 }) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const inputRef = React.useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.size <= maxSize) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    } else {
      alert('File size exceeds maximum');
    }
  };

  return (
    <motion.div
      onDragOver={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
      <p className="text-gray-600 dark:text-gray-400 mb-2">Drag file here or click to select</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current.click()}
        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
      >
        Select File
      </button>
      {file && (
        <div className="mt-4 flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
          <button onClick={() => setFile(null)}>
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
    </motion.div>
  );
}