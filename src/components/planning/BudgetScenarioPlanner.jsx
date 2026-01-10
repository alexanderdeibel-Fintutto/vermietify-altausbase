import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target } from 'lucide-react';

export default function BudgetScenarioPlanner() {
  const [scenarios, setScenarios] = useState([
    { name: 'Konservativ', income: 50000, expenses: 40000 },
    { name: 'Optimistisch', income: 70000, expenses: 38000 }
  ]);

  const compareMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('compareScenarios', { scenarios });
      return response.data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Budget-Szenarien
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scenarios.map((s, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-sm mb-2">{s.name}</p>
            <div className="flex gap-2">
              <Badge className="bg-green-600">Einkommen: {s.income}€</Badge>
              <Badge className="bg-red-600">Ausgaben: {s.expenses}€</Badge>
              <Badge>Überschuss: {s.income - s.expenses}€</Badge>
            </div>
          </div>
        ))}
        <Button onClick={() => compareMutation.mutate()} className="w-full">
          Szenarien vergleichen
        </Button>
      </CardContent>
    </Card>
  );
}