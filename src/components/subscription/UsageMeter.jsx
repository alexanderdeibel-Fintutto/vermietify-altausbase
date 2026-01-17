import React from 'react';
import { VfProgress } from '@/components/shared/VfProgress';
import { AlertTriangle } from 'lucide-react';

export default function UsageMeter({ 
  current, 
  max, 
  label,
  unit = '',
  warningThreshold = 0.8 
}) {
  const percentage = max === -1 ? 0 : (current / max) * 100;
  const isNearLimit = max !== -1 && percentage >= warningThreshold * 100;
  const isUnlimited = max === -1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-semibold">
          {current} {!isUnlimited && `/ ${max}`} {unit}
        </span>
      </div>
      
      {!isUnlimited && (
        <>
          <VfProgress 
            value={current} 
            max={max}
            variant={isNearLimit ? 'error' : 'gradient'}
          />
          
          {isNearLimit && (
            <div className="flex items-center gap-2 text-xs text-[var(--vf-warning-600)]">
              <AlertTriangle className="h-3 w-3" />
              Limit bald erreicht
            </div>
          )}
        </>
      )}
      
      {isUnlimited && (
        <div className="text-xs text-[var(--vf-success-600)]">
          ✓ Unbegrenzt verfügbar
        </div>
      )}
    </div>
  );
}