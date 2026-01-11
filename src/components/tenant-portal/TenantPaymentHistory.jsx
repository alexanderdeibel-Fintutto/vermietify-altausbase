import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Euro, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function TenantPaymentHistory({ tenantId, contractId }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', tenantId],
    queryFn: () => base44.entities.Payment.filter({ tenant_id: tenantId }, '-payment_date', 12)
  });

  const { data: contract } = useQuery({
    queryKey: ['contract-details', contractId],
    queryFn: () => base44.entities.LeaseContract.read(contractId),
    enabled: !!contractId
  });

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  nextDueDate.setDate(1);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Zahlungsübersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Nächste Zahlung</p>
              <p className="text-2xl font-bold text-blue-900">
                {contract?.monthly_rent && contract?.utility_advance 
                  ? (parseFloat(contract.monthly_rent) + parseFloat(contract.utility_advance)).toFixed(2)
                  : '0.00'}€
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-700 mt-2">
                <Calendar className="w-3 h-3" />
                <span>Fällig: {nextDueDate.toLocaleDateString('de-DE')}</span>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Gezahlt (12 Mon.)</p>
              <p className="text-2xl font-bold text-green-900">{totalPaid.toFixed(2)}€</p>
              <div className="flex items-center gap-1 text-xs text-green-700 mt-2">
                <TrendingUp className="w-3 h-3" />
                <span>{payments.length} Zahlungen</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zahlungshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    payment.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {payment.status === 'completed' ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> :
                      <Clock className="w-4 h-4 text-orange-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(payment.payment_date).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-600">{payment.payment_type || 'Mietzahlung'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{parseFloat(payment.amount).toFixed(2)}€</p>
                  <Badge variant="outline" className="text-xs">
                    {payment.status === 'completed' ? 'Bezahlt' : 'Ausstehend'}
                  </Badge>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-center text-slate-600 py-8">Keine Zahlungen gefunden</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}