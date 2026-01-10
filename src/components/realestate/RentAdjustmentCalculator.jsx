import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calculator } from 'lucide-react';

export default function RentAdjustmentCalculator() {
  const [currentRent, setCurrentRent] = useState(0);
  const [area, setArea] = useState(0);

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('calculateRentAdjustment', {
        current_rent: currentRent,
        area
      });
      return response.data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Mietpreis-Anpassung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Aktuelle Miete"
          value={currentRent}
          onChange={(e) => setCurrentRent(parseFloat(e.target.value))}
        />
        <Input
          type="number"
          placeholder="Fläche in m²"
          value={area}
          onChange={(e) => setArea(parseFloat(e.target.value))}
        />
        <Button onClick={() => calculateMutation.mutate()} className="w-full">
          Berechnen
        </Button>
        {calculateMutation.data && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm">Empfohlene Miete:</p>
            <Badge className="bg-green-600 text-lg">{calculateMutation.data.recommended_rent}€</Badge>
            <p className="text-xs text-slate-600 mt-2">
              Ortsübliche Vergleichsmiete: {calculateMutation.data.local_average}€/m²
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}