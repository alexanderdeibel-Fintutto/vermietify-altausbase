import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Route } from 'lucide-react';

export default function UserJourneyTracker() {
  const journeySteps = [
    { step: 'Anmeldung', completed: 150, percentage: 100 },
    { step: 'Objekt angelegt', completed: 120, percentage: 80 },
    { step: 'Mieter angelegt', completed: 90, percentage: 60 },
    { step: 'Vertrag erstellt', completed: 75, percentage: 50 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          User Journey
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {journeySteps.map((step, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm">{step.step}</span>
                <span className="text-sm font-medium">{step.completed} ({step.percentage}%)</span>
              </div>
              <div className="h-2 bg-[var(--theme-surface)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--theme-primary)] rounded-full transition-all"
                  style={{ width: `${step.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}