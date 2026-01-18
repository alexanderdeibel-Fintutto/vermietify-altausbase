import React from 'react';
import { VfProgress } from '@/components/shared/VfProgress';
import { Target } from 'lucide-react';

export default function LeadScoreIndicator({ score = 0 }) {
  const getVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-[var(--theme-text-muted)]" />
        <span className="text-sm font-medium">Lead-Score</span>
        <span className="ml-auto font-bold">{score}/100</span>
      </div>
      <VfProgress value={score} max={100} variant={getVariant(score)} />
    </div>
  );
}