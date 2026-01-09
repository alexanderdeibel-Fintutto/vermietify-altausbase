import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function UpcomingPaymentsWidget({ tenantEmail }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['upcomingPayments', tenantEmail],
    queryFn: () => base44.entities.Payment.filter({ tenant_email: tenantEmail }, '-due_date', 10)
  });

  const upcomingPayments = payments.filter(p => 
    p.status === 'pending' && new Date(p.due_date) >= new Date()
  ).slice(0, 3);

  const overduePayments = payments.filter(p => 
    p.status === 'pending' && new Date(p.due_date) < new Date()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="w-5 h-5" />
          Anstehende Zahlungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overduePayments.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-semibold text-red-900">{overduePayments.length} überfällige Zahlung(en)</p>
            </div>
          </div>
        )}
        
        {upcomingPayments.length === 0 ? (
          <p className="text-sm text-slate-600">Keine anstehenden Zahlungen</p>
        ) : (
          upcomingPayments.map(payment => (
            <div key={payment.id} className="p-3 border border-slate-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-slate-900">{payment.amount}€</p>
                <Badge className="bg-blue-100 text-blue-800">
                  {new Date(payment.due_date).toLocaleDateString('de-DE')}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{payment.payment_type || 'Miete'}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}