import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, TrendingDown } from 'lucide-react';

export default function VacancyForecast({ companyId }) {
  const { data: forecast } = useQuery({
    queryKey: ['vacancy-forecast', companyId],
    queryFn: async () => {
      const result = await base44.functions.invoke('forecastVacancy', { company_id: companyId });
      return result.data.forecast;
    }
  });

  if (!forecast) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="w-4 h-4" />
          Leerstandsmanagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-xs text-slate-600">Leerstände</p>
            <p className="text-2xl font-bold">{forecast.total_vacancies}</p>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <p className="text-xs text-red-600">Mietausfall</p>
            <p className="text-2xl font-bold text-red-900">{forecast.total_lost_rent}€</p>
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded">
          <p className="text-xs text-blue-600">Ø Dauer</p>
          <p className="text-lg font-bold text-blue-900">{forecast.avg_duration_days} Tage</p>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <p className="text-xs font-medium">Nach Grund:</p>
          {Object.entries(forecast.by_reason || {}).map(([reason, data]) => (
            <div key={reason} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{reason}</span>
              <Badge variant="outline">{data.count} ({data.total_lost}€)</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}