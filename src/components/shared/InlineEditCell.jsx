import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

export default function InlineEditCell({ 
  value, 
  onSave, 
  type = 'text',
  options = []
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

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
      <span
        onClick={() => setIsEditing(true)}
        className="cursor-pointer px-2 py-1 rounded hover:bg-slate-100 transition-colors"
      >
        {value || '—'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {type === 'select' ? (
        <select
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        className="h-8 w-8 p-0"
      >
        <Check className="w-4 h-4 text-emerald-600" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        className="h-8 w-8 p-0"
      >
        <X className="w-4 h-4 text-red-600" />
      </Button>
    </div>
  );
}