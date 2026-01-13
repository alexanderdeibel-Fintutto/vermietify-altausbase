import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FormError({ error, success, message }) {
  if (!error && !success) return null;

  if (success) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-emerald-700">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-red-700">{error?.title || 'Fehler'}</p>
        {error?.message && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
        {message && !error?.message && <p className="text-xs text-red-600 mt-1">{message}</p>}
      </div>
    </div>
  );
}