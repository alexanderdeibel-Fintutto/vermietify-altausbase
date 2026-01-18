import React from 'react';
import { VfProgress } from '@/components/shared/VfProgress';

export default function LeadScoreIndicator({ score }) {
  const getVariant = (score) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Lead-Score</span>
        <span className="text-sm font-bold">{score}/100</span>
      </div>
      <VfProgress value={score} variant={getVariant(score)} />
    </div>
  );
}