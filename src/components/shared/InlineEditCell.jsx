import React, { useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

export default function InlineEditCell({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 group">
        <span>{value}</span>
        <button 
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-3 w-3 text-[var(--theme-text-muted)]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="vf-input py-1 px-2 h-8 text-sm"
        autoFocus
      />
      <button onClick={handleSave} className="text-[var(--vf-success-500)]">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={() => { setIsEditing(false); setEditValue(value); }} className="text-[var(--vf-error-500)]">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}