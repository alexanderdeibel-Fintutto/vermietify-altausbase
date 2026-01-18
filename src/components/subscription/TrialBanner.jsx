import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, X } from 'lucide-react';

export default function TrialBanner({ daysLeft = 7, onUpgrade, onDismiss }) {
  return (
    <div className="bg-gradient-to-r from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] text-white p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Zap className="h-5 w-5" />
        <div>
          <div className="font-semibold">Noch {daysLeft} Tage in Ihrer Testphase</div>
          <div className="text-sm opacity-90">Upgraden Sie jetzt und erhalten Sie 20% Rabatt</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onUpgrade}>
          Jetzt upgraden
        </Button>
        {onDismiss && (
          <button onClick={onDismiss} className="p-2 hover:bg-white/10 rounded">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}