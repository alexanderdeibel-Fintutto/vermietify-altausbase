import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wallet } from 'lucide-react';

export default function DepositManager() {
  const { data: deposits } = useQuery({
    queryKey: ['depositOverview'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDepositOverview', {});
      return response.data;
    }
  });

  if (!deposits) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Kautions-Verwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded text-center">
            <p className="text-xs">Gesamt-Kautionen</p>
            <Badge className="bg-blue-600 text-lg">{deposits.total}€</Badge>
          </div>
          <div className="p-3 bg-green-50 rounded text-center">
            <p className="text-xs">Zinsen 2025</p>
            <Badge className="bg-green-600">{deposits.interest}€</Badge>
          </div>
        </div>
        <div className="space-y-2">
          {deposits.items.map(item => (
            <div key={item.id} className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{item.tenant_name}</span>
              <Badge variant="outline">{item.amount}€</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}