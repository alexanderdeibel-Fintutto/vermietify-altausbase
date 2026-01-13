import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingFallback({ 
  message = 'Wird geladen...',
  fullScreen = false 
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="p-8">
      {content}
    </div>
  );
}