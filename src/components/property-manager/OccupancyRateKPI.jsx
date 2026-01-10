import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function OccupancyRateKPI() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['kpi-occupancy'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateOccupancyRate', {});
      return response.data;
    }
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Lädt...</CardContent></Card>;
  }

  const trend = kpi.trend > 0 ? 'up' : 'down';
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="w-5 h-5" />
          Auslastungsrate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold">{kpi.rate}%</div>
          <div className={`flex items-center gap-1 mb-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{Math.abs(kpi.trend)}%</span>
          </div>
        </div>

        <Progress value={kpi.rate} className="h-3" />

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="p-2 bg-green-50 rounded">
            <p className="text-xs text-slate-600">Vermietet</p>
            <p className="font-bold">{kpi.occupied}</p>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <p className="text-xs text-slate-600">Leer</p>
            <p className="font-bold">{kpi.vacant}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-xs text-slate-600">Gesamt</p>
            <p className="font-bold">{kpi.total}</p>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-slate-600">Details nach Gebäude:</p>
          <div className="space-y-1 mt-2">
            {kpi.by_building.slice(0, 3).map((building, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-600">{building.name}</span>
                <span className="font-semibold">{building.occupancy_rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}