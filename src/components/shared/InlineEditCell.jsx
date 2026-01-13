import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InlineEditCell({ 
  value,
  onSave,
  type = 'text',
  placeholder = 'Bearbeiten...'
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (inputValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(inputValue);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setInputValue(value);
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
      <div
        onClick={() => setIsEditing(true)}
        className="px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
      >
        {value || <span className="text-slate-400">Klicken zum Bearbeiten</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type={type}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 text-sm"
        disabled={isSaving}
      />
      <Button
        onClick={handleSave}
        disabled={isSaving}
        size="sm"
        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button
        onClick={handleCancel}
        disabled={isSaving}
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}