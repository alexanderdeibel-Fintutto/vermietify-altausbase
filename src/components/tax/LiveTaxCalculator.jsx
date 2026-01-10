import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calculator } from 'lucide-react';

export default function LiveTaxCalculator() {
  const [income, setIncome] = useState(0);

  const { data: calculation } = useQuery({
    queryKey: ['liveTax', income],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateLiveTax', { income });
      return response.data;
    },
    enabled: income > 0
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Live-Steuerberechnung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Jahreseinkommen"
          value={income}
          onChange={(e) => setIncome(parseFloat(e.target.value))}
        />
        {calculation && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Einkommensteuer:</span>
              <Badge className="bg-red-600">{calculation.income_tax}€</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Solidaritätszuschlag:</span>
              <Badge variant="outline">{calculation.soli}€</Badge>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-sm">Gesamt:</span>
              <Badge className="bg-blue-600">{calculation.total_tax}€</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Netto:</span>
              <Badge className="bg-green-600">{calculation.net_income}€</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}