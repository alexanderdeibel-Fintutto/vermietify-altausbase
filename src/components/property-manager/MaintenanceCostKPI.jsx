import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MaintenanceCostKPI() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['kpi-maintenance'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateMaintenanceCosts', {});
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
          <Wrench className="w-5 h-5" />
          Instandhaltungskosten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold">{kpi.total_cost}€</div>
          <div className={`flex items-center gap-1 mb-2 ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{Math.abs(kpi.trend)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-xs text-slate-600">Ø pro Objekt</p>
            <p className="font-bold">{kpi.avg_per_building}€</p>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <p className="text-xs text-slate-600">Ø pro m²</p>
            <p className="font-bold">{kpi.avg_per_sqm}€</p>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-slate-600 mb-2">Kosten nach Monat:</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={kpi.by_month}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="cost" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-slate-600 mb-2">Top Kostenpunkte:</p>
          {kpi.top_categories.map((cat, idx) => (
            <div key={idx} className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">{cat.category}</span>
              <span className="font-semibold">{cat.cost}€</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}