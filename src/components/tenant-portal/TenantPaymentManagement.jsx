import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CreditCard, CheckCircle, Clock, AlertCircle, Download, Calendar } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  partial: 'bg-orange-100 text-orange-800'
};

export default function TenantPaymentManagement({ tenantId, contractId }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['tenant-payments', tenantId, selectedYear],
    queryFn: async () => {
      const allPayments = await base44.entities.Payment.filter({ 
        tenant_id: tenantId
      });
      
      return allPayments
        .filter(p => new Date(p.payment_date || p.created_date).getFullYear() === selectedYear)
        .sort((a, b) => new Date(b.payment_date || b.created_date) - new Date(a.payment_date || a.created_date));
    },
    enabled: !!tenantId
  });

  const { data: contract } = useQuery({
    queryKey: ['tenant-contract', contractId],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.filter({ id: contractId });
      return contracts[0];
    },
    enabled: !!contractId
  });

  const totalPaid = payments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = payments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const overduePending = payments.filter(p => {
    if (p.payment_status !== 'pending') return false;
    const dueDate = new Date(p.due_date);
    return dueDate < new Date();
  }).length;

  const years = [...new Set(payments.map(p => 
    new Date(p.payment_date || p.created_date).getFullYear()
  ))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPaid.toFixed(2)} €</p>
                <p className="text-xs text-slate-600">Bezahlt {selectedYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPending.toFixed(2)} €</p>
                <p className="text-xs text-slate-600">Ausstehend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contract?.total_rent || 0} €</p>
                <p className="text-xs text-slate-600">Monatliche Miete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {overduePending > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                <strong>{overduePending}</strong> überfällige Zahlung{overduePending !== 1 ? 'en' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Zahlungsübersicht</CardTitle>
            {years.length > 1 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4 text-slate-600">Lädt...</p>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Keine Zahlungen für {selectedYear}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(payment => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {payment.description || 'Mietzahlung'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.payment_date || payment.created_date).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{payment.amount?.toFixed(2)} €</p>
                      <Badge className={statusColors[payment.payment_status]}>
                        {payment.payment_status === 'paid' && 'Bezahlt'}
                        {payment.payment_status === 'pending' && 'Ausstehend'}
                        {payment.payment_status === 'overdue' && 'Überfällig'}
                        {payment.payment_status === 'partial' && 'Teilweise'}
                      </Badge>
                    </div>
                  </div>

                  {payment.due_date && payment.payment_status === 'pending' && (
                    <div className="mt-2 text-xs text-slate-600">
                      Fällig am: {new Date(payment.due_date).toLocaleDateString('de-DE')}
                    </div>
                  )}

                  {payment.payment_method && (
                    <div className="mt-2 text-xs text-slate-600">
                      Zahlungsmethode: {payment.payment_method}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}