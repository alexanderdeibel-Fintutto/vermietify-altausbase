import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Euro, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EnhancedPaymentPortal({ tenantId, contractId }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      return await base44.entities.Payment.filter({ contract_id: contractId }, '-payment_date', 12);
    },
    enabled: !!contractId
  });

  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => contractId ? base44.entities.LeaseContract.read(contractId) : null,
    enabled: !!contractId
  });

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const thisMonthPayment = payments.find(p => {
    const paymentDate = new Date(p.payment_date);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });

  const nextDueDate = new Date(currentYear, currentMonth + 1, 1);
  const daysUntilDue = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));

  const chartData = payments.slice(0, 6).reverse().map(p => ({
    month: new Date(p.payment_date).toLocaleDateString('de-DE', { month: 'short' }),
    amount: p.amount
  }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Nächste Fälligkeit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">Fällig am</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {nextDueDate.toLocaleDateString('de-DE')}
              </p>
              <Badge className="bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                in {daysUntilDue} Tagen
              </Badge>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-slate-600 mb-1">Betrag</p>
                <p className="text-2xl font-bold text-slate-900">
                  €{((contract?.rent_amount || 0) + (contract?.utilities_advance || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Zahlungsverlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Zahlungshistorie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
          {payments.map(payment => (
            <div key={payment.id} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">€{payment.amount?.toFixed(2)}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {payment.payment_type || 'Miete'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                {new Date(payment.payment_date).toLocaleDateString('de-DE', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          ))}
          {payments.length === 0 && (
            <p className="text-center text-slate-600 py-8">Keine Zahlungen vorhanden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}