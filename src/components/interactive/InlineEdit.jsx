import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function InlineEdit({ value, onSave, type = 'text', className = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue !== value) {
      await onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
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
      <span
        onDoubleClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors ${className}`}
        title="Doppelklick zum Bearbeiten"
      >
        {value || <span className="text-gray-400 italic">Leer</span>}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <button onClick={handleSave} className="text-green-600 hover:text-green-700">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={handleCancel} className="text-red-600 hover:text-red-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}