import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

export default function DepositTracker({ buildingId }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' }, null, 100)
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(null, 200)
  });

  const depositsStatus = contracts.map(c => ({
    tenant: tenants.find(t => t.id === c.tenant_id),
    amount: c.deposit,
    paid: c.deposit_paid,
    contract_id: c.id
  }));

  const totalDeposits = depositsStatus.reduce((sum, d) => sum + (d.amount || 0), 0);
  const paidDeposits = depositsStatus.filter(d => d.paid).length;
  const unpaidDeposits = depositsStatus.filter(d => !d.paid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Kautionen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-blue-50 rounded text-center">
            <p className="text-xs text-blue-900">Gesamt</p>
            <p className="text-lg font-bold text-blue-900">{totalDeposits.toLocaleString('de-DE')}€</p>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-xs text-green-900">Bezahlt</p>
            <p className="text-lg font-bold text-green-900">{paidDeposits}</p>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <p className="text-xs text-red-900">Offen</p>
            <p className="text-lg font-bold text-red-900">{unpaidDeposits}</p>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {depositsStatus.map((deposit, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {deposit.tenant?.first_name} {deposit.tenant?.last_name}
                </p>
                <p className="text-xs text-slate-600">{deposit.amount?.toLocaleString('de-DE')} €</p>
              </div>
              {deposit.paid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}