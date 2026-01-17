import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import { Home } from 'lucide-react';

export default function VacancyForecast() {
  const data = [
    { name: 'Jan', value: 2 },
    { name: 'Feb', value: 1 },
    { name: 'Mär', value: 3 },
    { name: 'Apr', value: 2 },
    { name: 'Mai', value: 1 },
    { name: 'Jun', value: 2 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Leerstand-Prognose
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleBarChart data={data} height={200} color="#F97316" />
        <div className="mt-4 p-3 bg-[var(--vf-info-50)] rounded-lg">
          <div className="text-xs text-[var(--vf-info-700)]">
            Durchschnittlich 1,8 leere Einheiten pro Monat
          </div>
        </div>
      </CardContent>
    </Card>
  );
}