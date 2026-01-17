import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Users } from 'lucide-react';

export default function OnboardingFunnelTracker({ data = [] }) {
  const steps = [
    { label: 'Registrierung', count: 100 },
    { label: 'Profil erstellt', count: 85 },
    { label: 'Erstes Objekt', count: 62 },
    { label: 'Erster Vertrag', count: 45 },
    { label: 'Upgrade zu Pro', count: 28 }
  ];

  const maxCount = steps[0].count;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Onboarding Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => {
          const percentage = (step.count / maxCount) * 100;
          const dropoff = index > 0 ? steps[index - 1].count - step.count : 0;
          
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium">{step.label}</span>
                <div className="text-right">
                  <span className="font-semibold">{step.count}</span>
                  {dropoff > 0 && (
                    <span className="text-xs text-[var(--vf-error-600)] ml-2">
                      -{dropoff}
                    </span>
                  )}
                </div>
              </div>
              <VfProgress value={percentage} max={100} variant="gradient" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}