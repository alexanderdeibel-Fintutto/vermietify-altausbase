import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function PaymentPunctualityKPI() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['kpi-payment'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculatePaymentPunctuality', {});
      return response.data;
    }
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Lädt...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5" />
          Zahlungspünktlichkeit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold">{kpi.on_time_rate}%</div>
          <div className="text-sm text-green-600 mb-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Pünktlich
          </div>
        </div>

        <Progress value={kpi.on_time_rate} className="h-3" />

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="p-2 bg-green-50 rounded">
            <p className="text-xs text-slate-600">Pünktlich</p>
            <p className="font-bold">{kpi.on_time}</p>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <p className="text-xs text-slate-600">Verspätet</p>
            <p className="font-bold">{kpi.late}</p>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <p className="text-xs text-slate-600">Ausständig</p>
            <p className="font-bold">{kpi.outstanding}</p>
          </div>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Ø Verzögerung:</span>
            <span className="font-semibold">{kpi.average_delay_days} Tage</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Offener Betrag:</span>
            <span className="font-bold text-red-600">{kpi.outstanding_amount}€</span>
          </div>
        </div>

        {kpi.problematic_tenants.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-800">Auffällige Mieter:</p>
            </div>
            {kpi.problematic_tenants.slice(0, 3).map((tenant, idx) => (
              <div key={idx} className="text-xs text-slate-600">
                • {tenant.name} ({tenant.late_payments}x verspätet)
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}