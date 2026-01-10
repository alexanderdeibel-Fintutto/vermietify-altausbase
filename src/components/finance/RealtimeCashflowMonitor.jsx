import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-xs">Einnahmen</p>
            <Badge className="bg-green-600">{cashflow.income}€</Badge>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <p className="text-xs">Ausgaben</p>
            <Badge className="bg-red-600">{cashflow.expenses}€</Badge>
          </div>
          <div className="p-2 bg-blue-50 rounded text-center">
            <p className="text-xs">Saldo</p>
            <Badge className="bg-blue-600">{cashflow.balance}€</Badge>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={cashflow.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="#3b82f633" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}