import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity } from 'lucide-react';

export default function RealtimeCashflowMonitor() {
  const { data: cashflow } = useQuery({
    queryKey: ['realtimeCashflow'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateRealtimeCashflow', {});
      return response.data;
    },
    refetchInterval: 60000
  });

  if (!cashflow) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Echtzeit-Cashflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <p className="text-sm text-slate-600">Aktueller Kontostand</p>
          <p className="text-3xl font-bold">{cashflow.balance.toLocaleString('de-DE')}€</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded">
            <p className="text-xs">Einnahmen (30d)</p>
            <Badge className="bg-green-600">+{cashflow.income_30d}€</Badge>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <p className="text-xs">Ausgaben (30d)</p>
            <Badge className="bg-red-600">-{cashflow.expenses_30d}€</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}