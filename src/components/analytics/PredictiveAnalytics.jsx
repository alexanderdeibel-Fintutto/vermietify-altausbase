import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function PredictiveAnalytics() {
  const predictions = [
    { 
      title: 'Mieteinnahmen Q1 2026', 
      prediction: '+8%', 
      confidence: 85,
      trend: 'up',
      icon: TrendingUp
    },
    { 
      title: 'Wartungskosten', 
      prediction: '+15%', 
      confidence: 72,
      trend: 'warning',
      icon: AlertTriangle
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Vorhersage-Analysen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictions.map((pred, index) => (
            <div key={index} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2">
                  <pred.icon className={`h-5 w-5 mt-0.5 ${pred.trend === 'up' ? 'text-[var(--vf-success-500)]' : 'text-[var(--vf-warning-500)]'}`} />
                  <div>
                    <div className="font-medium text-sm">{pred.title}</div>
                    <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                      Zuversicht: {pred.confidence}%
                    </div>
                  </div>
                </div>
                <VfBadge variant={pred.trend === 'up' ? 'success' : 'warning'}>
                  {pred.prediction}
                </VfBadge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}