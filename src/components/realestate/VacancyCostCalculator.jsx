import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function VacancyCostCalculator() {
  const [rent, setRent] = useState(0);
  const [months, setMonths] = useState(0);

  const loss = rent * months;
  const additionalCosts = months * 100;
  const total = loss + additionalCosts;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Leerstandskosten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Monatliche Miete"
          value={rent}
          onChange={(e) => setRent(parseFloat(e.target.value))}
        />
        <Input
          type="number"
          placeholder="Monate Leerstand"
          value={months}
          onChange={(e) => setMonths(parseFloat(e.target.value))}
        />
        {total > 0 && (
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm mb-2">Gesamtkosten Leerstand:</p>
            <Badge className="bg-red-600 text-xl">{total.toFixed(0)}€</Badge>
            <div className="mt-2 text-xs text-slate-600">
              <p>Mietausfall: {loss}€</p>
              <p>Zusatzkosten: {additionalCosts}€</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}