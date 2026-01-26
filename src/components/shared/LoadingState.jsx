import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Lädt...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-12 h-12 text-blue-900 animate-spin mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}