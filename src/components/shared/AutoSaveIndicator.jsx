import React from 'react';
import { Cloud, CloudOff, Check } from 'lucide-react';

export default function AutoSaveIndicator({ isSaving, lastSaved }) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Cloud className="w-4 h-4 animate-pulse" />
        <span>Speichert...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        <span>Gespeichert</span>
      </div>
    );
  }

  return null;
}