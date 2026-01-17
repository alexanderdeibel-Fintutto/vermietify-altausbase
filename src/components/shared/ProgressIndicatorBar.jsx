import React from 'react';
import { VfProgress } from './VfProgress';
import { CheckCircle } from 'lucide-react';

export default function ProgressIndicatorBar({ current, total, label }) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-[var(--theme-text-muted)]">{current}/{total}</span>
      </div>
      <VfProgress value={percentage} max={100} variant={percentage === 100 ? 'success' : 'default'} />
      {percentage === 100 && (
        <div className="flex items-center gap-2 text-sm text-[var(--vf-success-600)]">
          <CheckCircle className="h-4 w-4" />
          Abgeschlossen
        </div>
      )}
    </div>
  );
}