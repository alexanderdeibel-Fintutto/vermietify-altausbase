import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { VfProgress } from '@/components/shared/VfProgress';

export default function OnboardingFunnelTracker() {
  const steps = [
    { name: 'Account erstellt', count: 100, percentage: 100 },
    { name: 'Objekt hinzugefügt', count: 75, percentage: 75 },
    { name: 'Mieter angelegt', count: 60, percentage: 60 },
    { name: 'Vertrag erstellt', count: 45, percentage: 45 },
    { name: 'Erste Rechnung', count: 30, percentage: 30 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Onboarding-Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{step.name}</span>
                <span className="text-sm text-[var(--theme-text-muted)]">{step.count} Nutzer</span>
              </div>
              <VfProgress value={step.percentage} max={100} variant="gradient" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}