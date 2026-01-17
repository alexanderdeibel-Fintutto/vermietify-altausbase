import React, { useState } from 'react';
import { VfInput } from './VfInput';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InlineEditCell({ value, onSave, type = 'text' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="cursor-pointer hover:bg-[var(--theme-surface)] px-2 py-1 rounded transition-colors"
      >
        {value || '-'}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <VfInput
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="flex-1"
        autoFocus
      />
      <button onClick={handleSave} className="text-[var(--vf-success-600)]">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={handleCancel} className="text-[var(--vf-error-600)]">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}