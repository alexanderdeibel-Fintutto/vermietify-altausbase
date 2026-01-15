import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function TenantPaymentHistory({ leaseId, tenantEmail }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['tenantPayments', leaseId],
    queryFn: async () => {
      const all = await base44.entities.ActualPayment.list();
      return all.filter(p => p.lease_contract_id === leaseId).sort((a, b) => 
        new Date(b.payment_date) - new Date(a.payment_date)
      );
    }
  });

  const stats = {
    total_paid: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    count: payments.length
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'PENDING') return <Clock className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Gezahlte Miete</p>
            <p className="text-2xl font-bold">€{stats.total_paid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Ausstehend</p>
            <p className="text-2xl font-bold text-red-600">€{stats.pending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Zahlungen</p>
            <p className="text-2xl font-bold">{stats.count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zahlungshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">
                        {payment.payment_type === 'RENT' ? 'Miete' : 'Nebenkosten'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">€{payment.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">{payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">Keine Zahlungen vorhanden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}