import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap } from 'lucide-react';

export default function EnergyEfficiencyTracker({ buildingId }) {
  const { data: efficiency } = useQuery({
    queryKey: ['energy', buildingId],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateEnergyEfficiency', { building_id: buildingId });
      return response.data;
    },
    enabled: !!buildingId
  });

  if (!efficiency) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Energieeffizienz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Energieklasse</span>
          <Badge className="bg-green-600 text-lg">{efficiency.class}</Badge>
        </div>
        <Progress value={efficiency.score} />
        <div className="text-xs text-slate-600 space-y-1">
          <p>• Verbrauch: {efficiency.consumption} kWh/m²/Jahr</p>
          <p>• Einsparpotenzial: {efficiency.savings_potential}€/Jahr</p>
        </div>
      </CardContent>
    </Card>
  );
}