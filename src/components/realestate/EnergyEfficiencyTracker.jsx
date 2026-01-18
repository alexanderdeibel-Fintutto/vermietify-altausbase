import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { VfProgress } from '@/components/shared/VfProgress';

export default function EnergyEfficiencyTracker({ buildingId }) {
  const efficiency = {
    rating: 'B',
    score: 75,
    consumption: 85,
    target: 100
  };

  const getRatingColor = (rating) => {
    const colors = {
      'A+': 'text-green-700',
      'A': 'text-green-600',
      'B': 'text-lime-600',
      'C': 'text-yellow-600',
      'D': 'text-orange-600',
      'E': 'text-red-600'
    };
    return colors[rating] || 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Energieeffizienz
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getRatingColor(efficiency.rating)}`}>
            {efficiency.rating}
          </div>
          <div className="text-sm text-[var(--theme-text-muted)] mt-1">Energieklasse</div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Effizienz-Score</span>
              <span className="text-sm font-bold">{efficiency.score}%</span>
            </div>
            <VfProgress value={efficiency.score} variant="success" />
          </div>

          <div className="p-3 bg-[var(--theme-surface)] rounded-lg">
            <div className="text-xs text-[var(--theme-text-muted)] mb-1">Verbrauch</div>
            <div className="font-bold">{efficiency.consumption} kWh/m²/Jahr</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}