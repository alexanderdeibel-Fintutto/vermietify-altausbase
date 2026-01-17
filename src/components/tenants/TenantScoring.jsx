import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Award, CheckCircle, AlertCircle } from 'lucide-react';

export default function TenantScoring({ tenant }) {
  const score = 85;
  const factors = [
    { label: 'Zahlungspünktlichkeit', value: 95, status: 'good' },
    { label: 'Mietdauer', value: 80, status: 'good' },
    { label: 'Kommunikation', value: 75, status: 'medium' }
  ];

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
          <div className="text-5xl font-bold text-[var(--vf-success-600)] mb-2">
            {score}
          </div>
          <div className="text-sm text-[var(--theme-text-muted)]">von 100 Punkten</div>
        </div>

        <div className="space-y-4">
          {factors.map((factor, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {factor.status === 'good' ? (
                    <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)]" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-[var(--vf-warning-500)]" />
                  )}
                  <span className="text-sm">{factor.label}</span>
                </div>
                <span className="text-sm font-semibold">{factor.value}%</span>
              </div>
              <VfProgress 
                value={factor.value} 
                max={100} 
                variant={factor.value >= 80 ? 'success' : 'warning'}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}