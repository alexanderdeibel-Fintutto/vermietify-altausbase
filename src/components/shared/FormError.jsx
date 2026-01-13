import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormError({ 
  message = '',
  show = true 
}) {
  if (!show || !message) return null;

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}