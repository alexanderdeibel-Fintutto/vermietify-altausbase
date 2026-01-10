import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wallet } from 'lucide-react';

export default function DepositManager() {
  const { data: deposits } = useQuery({
    queryKey: ['deposits'],
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
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-slate-600">Gesamt verwaltete Kautionen</p>
          <p className="text-2xl font-bold text-blue-900">{deposits.total.toLocaleString('de-DE')}€</p>
        </div>
        <div className="space-y-2">
          {deposits.items.map(dep => (
            <div key={dep.id} className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{dep.tenant_name}</span>
              <div className="flex gap-2">
                <Badge className={dep.paid ? 'bg-green-600' : 'bg-orange-600'}>
                  {dep.amount}€
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}