import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function FinancialSnapshotWidget({ tenantEmail, tenantId }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['tenantFinancials', tenantEmail],
    queryFn: () => base44.entities.Payment.filter({ tenant_email: tenantEmail }, '-payment_date', 50),
    enabled: !!tenantEmail
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenantContracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }, '-start_date', 10),
    enabled: !!tenantId
  });

  const activeContract = contracts.find(c => c.status === 'active');
  const recentPayments = payments.slice(0, 3);
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const completedPayments = payments.filter(p => p.status === 'completed');
  
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastPaymentDate = completedPayments[0]?.payment_date;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Finanzübersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded">
          <p className="text-xs text-blue-700 mb-1">Aktueller Stand</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-blue-900">
              {totalPending > 0 ? `-${totalPending.toLocaleString('de-DE')}€` : '0€'}
            </p>
            {totalPending === 0 ? (
              <Badge className="bg-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Bezahlt
              </Badge>
            ) : (
              <Badge className="bg-amber-600">
                <Clock className="w-3 h-3 mr-1" />
                Offen
              </Badge>
            )}
          </div>
        </div>

        {/* Monthly Rent */}
        {activeContract && (
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <span className="text-xs text-slate-600">Monatliche Miete</span>
            <span className="text-sm font-semibold text-slate-900">
              {activeContract.total_rent?.toLocaleString('de-DE')}€
            </span>
          </div>
        )}

        {/* Last Payment */}
        {lastPaymentDate && (
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <span className="text-xs text-slate-600">Letzte Zahlung</span>
            <span className="text-sm font-semibold text-slate-900">
              {new Date(lastPaymentDate).toLocaleDateString('de-DE')}
            </span>
          </div>
        )}

        {/* Recent Payments */}
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-slate-500" />
            <p className="text-xs font-medium text-slate-700">Letzte Zahlungen</p>
          </div>
          <div className="space-y-2">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-500">Keine Zahlungen</p>
            ) : (
              recentPayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {new Date(payment.payment_date).toLocaleDateString('de-DE')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{payment.amount?.toLocaleString('de-DE')}€</span>
                    {payment.status === 'completed' ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}