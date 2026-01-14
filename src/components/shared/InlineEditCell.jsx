import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InlineEditCell({ 
  value,
  onSave,
  type = 'text',
  validate
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (validate) {
      const validationError = validate(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      await onSave(editValue);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="group flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md transition-colors"
      >
        <span className="text-sm text-slate-700">
          {value || <span className="text-slate-400">Leer</span>}
        </span>
        <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-2"
    >
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`h-8 text-sm ${error ? 'border-red-500' : ''}`}
      />
      <button
        onClick={handleSave}
        className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={handleCancel}
        className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </motion.div>
  );
}