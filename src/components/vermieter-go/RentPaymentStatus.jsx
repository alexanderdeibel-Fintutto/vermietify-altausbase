import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function RentPaymentStatus({ buildingId }) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: payments = [] } = useQuery({
    queryKey: ['rentPayments', buildingId, currentMonth],
    queryFn: async () => {
      const allPayments = await base44.entities.Payment.filter({}, '-payment_date', 100);
      return allPayments.filter(p => p.payment_date?.startsWith(currentMonth));
    }
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['activeContracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' }, null, 100)
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(null, 200)
  });

  const paymentStatus = contracts.map(contract => {
    const tenant = tenants.find(t => t.id === contract.tenant_id);
    const paid = payments.find(p => p.contract_id === contract.id);
    return {
      tenant_name: `${tenant?.first_name} ${tenant?.last_name}`,
      amount: contract.total_rent,
      paid: !!paid,
      payment_date: paid?.payment_date
    };
  });

  const paidCount = paymentStatus.filter(p => p.paid).length;
  const unpaidCount = paymentStatus.filter(p => !p.paid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Mietzahlungen {new Date().toLocaleDateString('de-DE', { month: 'long' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-900">Bezahlt</p>
            </div>
            <p className="text-2xl font-bold text-green-900">{paidCount}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-xs font-semibold text-red-900">Offen</p>
            </div>
            <p className="text-2xl font-bold text-red-900">{unpaidCount}</p>
          </div>
        </div>

        <div className="space-y-2">
          {paymentStatus.slice(0, 5).map((status, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-semibold">{status.tenant_name}</p>
                <p className="text-xs text-slate-600">{status.amount?.toFixed(2)} €</p>
              </div>
              <Badge className={status.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {status.paid ? 'Bezahlt' : 'Offen'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}