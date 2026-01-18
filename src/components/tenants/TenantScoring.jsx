import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Award } from 'lucide-react';

export default function TenantScoring({ tenant }) {
  const scores = {
    paymentHistory: 95,
    communication: 88,
    propertyCondition: 92,
    overall: 92
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Mieter-Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-[var(--theme-primary)] mb-2">
            {scores.overall}
          </div>
          <div className="text-sm text-[var(--theme-text-muted)]">Gesamt-Score</div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Zahlungshistorie</span>
              <span className="text-sm font-bold">{scores.paymentHistory}%</span>
            </div>
            <VfProgress value={scores.paymentHistory} variant="success" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Kommunikation</span>
              <span className="text-sm font-bold">{scores.communication}%</span>
            </div>
            <VfProgress value={scores.communication} variant="success" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Objektzustand</span>
              <span className="text-sm font-bold">{scores.propertyCondition}%</span>
            </div>
            <VfProgress value={scores.propertyCondition} variant="success" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}