import React from 'react';
import { VfProgress } from '@/components/shared/VfProgress';
import { Target } from 'lucide-react';

export default function LeadScoreIndicator({ score, size = 'md' }) {
  const getVariant = () => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'default';
  };

  const getLabel = () => {
    if (score >= 70) return 'Hot Lead';
    if (score >= 40) return 'Warm Lead';
    return 'Cold Lead';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[var(--theme-text-muted)]" />
          <span className="font-medium">{getLabel()}</span>
        </div>
        <span className="font-bold">{score}/100</span>
      </div>
      <VfProgress value={score} max={100} variant={getVariant()} />
    </div>
  );
}