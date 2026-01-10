import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp } from 'lucide-react';

export default function InvestmentPlanner() {
  const [amount, setAmount] = useState(0);
  const [duration, setDuration] = useState(5);

  const planMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('planInvestment', { amount, duration });
      return response.data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Investitions-Planer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Betrag in €"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
        <Input
          type="number"
          placeholder="Laufzeit in Jahren"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
        />
        <Button onClick={() => planMutation.mutate()} className="w-full">
          Planung erstellen
        </Button>
        {planMutation.data && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold">Erwarteter Wert</p>
            <Badge className="bg-green-600 text-lg">{planMutation.data.future_value}€</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}