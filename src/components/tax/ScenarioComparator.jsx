import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GitCompare } from 'lucide-react';

export default function ScenarioComparator() {
  const { data: comparison } = useQuery({
    queryKey: ['scenarioComparison'],
    queryFn: async () => {
      const response = await base44.functions.invoke('compareScenarios', {
        scenarios: [
          { name: 'Aktuell', income: 60000 },
          { name: 'Mit Immobilie', income: 60000, rental_income: 12000 },
          { name: 'Selbständig', income: 80000 }
        ]
      });
      return response.data;
    }
  });

  if (!comparison) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          Szenario-Vergleich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comparison.scenarios.map((scenario, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-sm mb-2">{scenario.name}</p>
            <div className="flex gap-2">
              <Badge className="bg-blue-600">Steuer: {scenario.tax}€</Badge>
              <Badge className="bg-green-600">Netto: {scenario.net}€</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}