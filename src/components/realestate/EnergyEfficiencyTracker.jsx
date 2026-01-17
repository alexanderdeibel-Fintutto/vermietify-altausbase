import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function EnergyEfficiencyTracker({ building }) {
  const energyClass = building?.energy_class || 'C';
  
  const colors = {
    'A+': 'vf-badge-success',
    'A': 'vf-badge-success',
    'B': 'vf-badge-info',
    'C': 'vf-badge-warning',
    'D': 'vf-badge-warning',
    'E': 'vf-badge-error'
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
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{energyClass}</div>
          <VfBadge variant="success" className="mb-4">Energieklasse</VfBadge>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
            <div>
              <div className="text-xs text-[var(--theme-text-muted)]">Verbrauch</div>
              <div className="font-bold">120 kWh/m²a</div>
            </div>
            <div>
              <div className="text-xs text-[var(--theme-text-muted)]">CO₂</div>
              <div className="font-bold">35 kg/m²a</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}