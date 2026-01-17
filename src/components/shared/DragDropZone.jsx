import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DragDropZone({ 
  onDrop, 
  accept = '*',
  multiple = false,
  className 
}) {
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
    onDrop(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    onDrop(files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        isDragging ? "border-[var(--vf-primary-600)] bg-[var(--vf-primary-50)]" : "border-[var(--theme-border)]",
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
        <p className="font-medium mb-1">Datei hier ablegen oder klicken</p>
        <p className="text-sm text-[var(--theme-text-muted)]">
          {multiple ? 'Mehrere Dateien möglich' : 'Eine Datei'}
        </p>
      </label>
    </div>
  );
}