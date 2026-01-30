import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingFallback({ message = 'Wird geladen...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {content}
      </div>
    );
  }

  return content;
}