import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calculator } from 'lucide-react';

export default function WhatIfScenarios() {
  const [scenario, setScenario] = useState({
    property_purchase: 0,
    additional_income: 0,
    investment_amount: 0
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('calculateWhatIf', scenario);
      return response.data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Was-wäre-wenn Szenarien
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-semibold">Immobilienkauf</label>
          <Input
            type="number"
            value={scenario.property_purchase}
            onChange={(e) => setScenario({...scenario, property_purchase: parseFloat(e.target.value)})}
            placeholder="Kaufpreis in €"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Zusätzliches Einkommen</label>
          <Input
            type="number"
            value={scenario.additional_income}
            onChange={(e) => setScenario({...scenario, additional_income: parseFloat(e.target.value)})}
            placeholder="Jährlich in €"
          />
        </div>

        <Button onClick={() => calculateMutation.mutate()} className="w-full">
          Szenario berechnen
        </Button>

        {calculateMutation.data && (
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <p className="text-sm font-semibold">Auswirkungen:</p>
            <div className="flex justify-between">
              <span className="text-xs">Steuerbelastung:</span>
              <Badge>{calculateMutation.data.tax_impact}€</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-xs">Nettovermögen:</span>
              <Badge className="bg-green-600">{calculateMutation.data.net_wealth}€</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}