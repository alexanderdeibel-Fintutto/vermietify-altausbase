import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { VfProgress } from '@/components/shared/VfProgress';
import PercentageDisplay from '@/components/shared/PercentageDisplay';

export default function ConversionTracker() {
  const conversions = [
    { goal: 'Vertragsabschluss', current: 12, target: 15, deadline: '2026-01-31' },
    { goal: 'Neue Mieter', current: 8, target: 10, deadline: '2026-02-28' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Ziele & Conversions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversions.map((conv, index) => {
            const percentage = (conv.current / conv.target) * 100;
            return (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{conv.goal}</span>
                  <PercentageDisplay value={percentage} />
                </div>
                <VfProgress value={percentage} max={100} variant="gradient" />
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                  {conv.current} von {conv.target} - Deadline: {new Date(conv.deadline).toLocaleDateString('de-DE')}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}