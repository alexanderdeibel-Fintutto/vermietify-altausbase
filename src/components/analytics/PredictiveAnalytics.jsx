import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain, TrendingUp, TrendingDown } from 'lucide-react';

export default function PredictiveAnalytics({ predictions = [] }) {
  const defaultPredictions = [
    {
      category: 'Mieteinnahmen',
      prediction: '+5.2%',
      confidence: 'Hoch',
      trend: 'up',
      message: 'Basierend auf Marktentwicklung wird ein Anstieg erwartet'
    },
    {
      category: 'Instandhaltungskosten',
      prediction: '+12%',
      confidence: 'Mittel',
      trend: 'up',
      message: 'Höhere Kosten aufgrund Gebäudealter zu erwarten'
    },
    {
      category: 'Leerstand',
      prediction: '-2.3%',
      confidence: 'Hoch',
      trend: 'down',
      message: 'Verbesserte Nachfrage im nächsten Quartal'
    }
  ];

  const items = predictions.length > 0 ? predictions : defaultPredictions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          KI-Prognosen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((pred, index) => (
            <div key={index} className="border-l-4 border-[var(--theme-primary)] pl-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{pred.category}</span>
                <div className="flex items-center gap-1">
                  {pred.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-[var(--vf-success-600)]" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-[var(--vf-error-600)]" />
                  )}
                  <span className="font-bold">{pred.prediction}</span>
                </div>
              </div>
              <p className="text-xs text-[var(--theme-text-secondary)]">{pred.message}</p>
              <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                Konfidenz: {pred.confidence}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}