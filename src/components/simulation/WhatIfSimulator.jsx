import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lightbulb } from 'lucide-react';

export default function WhatIfSimulator() {
  const [scenario, setScenario] = useState({ rent_increase: 0, vacancy_rate: 0 });

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('runWhatIfSimulation', scenario);
      return response.data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Was-wäre-wenn Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Mieterhöhung in %"
          value={scenario.rent_increase}
          onChange={(e) => setScenario({ ...scenario, rent_increase: parseFloat(e.target.value) })}
        />
        <Input
          type="number"
          placeholder="Leerstandsquote in %"
          value={scenario.vacancy_rate}
          onChange={(e) => setScenario({ ...scenario, vacancy_rate: parseFloat(e.target.value) })}
        />
        <Button onClick={() => simulateMutation.mutate()} className="w-full">
          Simulieren
        </Button>
        {simulateMutation.data && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold">Erwartetes Ergebnis:</p>
            <Badge className="bg-blue-600 text-lg">{simulateMutation.data.projected_income}€</Badge>
            <p className="text-xs text-slate-600 mt-2">
              Änderung: {simulateMutation.data.change > 0 ? '+' : ''}{simulateMutation.data.change}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}