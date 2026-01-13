import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingFallback({ 
  message = 'Wird geladen...',
  fullHeight = true
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullHeight ? 'min-h-96' : 'p-8'}`}>
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}