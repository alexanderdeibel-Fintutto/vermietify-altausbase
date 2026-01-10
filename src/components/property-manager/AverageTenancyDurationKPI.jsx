import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AverageTenancyDurationKPI() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['kpi-tenancy'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateAverageTenancyDuration', {});
      return response.data;
    }
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Lädt...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-5 h-5" />
          Durchschnittliche Mietdauer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold">{kpi.average_months}</div>
          <div className="text-lg text-slate-600 mb-2">Monate</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-xs text-slate-600">Aktive Mieter</p>
            <p className="font-bold">{kpi.active_tenants}</p>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <p className="text-xs text-slate-600">Beendet (12M)</p>
            <p className="font-bold">{kpi.ended_last_year}</p>
          </div>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Kürzeste Dauer:</span>
            <span className="font-semibold">{kpi.shortest} Monate</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Längste Dauer:</span>
            <span className="font-semibold">{kpi.longest} Monate</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Median:</span>
            <span className="font-semibold">{kpi.median} Monate</span>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-slate-600">Langzeit-Mieter (&gt;36M):</span>
            <Badge>{kpi.long_term_count}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}