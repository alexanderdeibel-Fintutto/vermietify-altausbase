import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PaymentAnalysis() {
  const { data: payments = [] } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => base44.entities.Payment.list('-payment_date', 500)
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['all-contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['all-tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  // Calculate overdue payments
  const now = new Date();
  const overduePayments = payments.filter(p => {
    const dueDate = new Date(p.payment_date);
    return p.status === 'pending' && dueDate < now;
  });

  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending');

  const totalOverdue = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Payment trends (last 12 months)
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
    
    const monthPayments = payments.filter(p => {
      const pDate = new Date(p.payment_date);
      return pDate.getMonth() === date.getMonth() && 
             pDate.getFullYear() === date.getFullYear() &&
             p.status === 'paid';
    });

    monthlyData.push({
      month,
      amount: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    });
  }

  // Get tenant name
  const getTenantName = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return 'Unbekannt';
    const tenant = tenants.find(t => t.id === contract.tenant_id);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
  };

  // Calculate payment punctuality
  const onTimePayments = paidPayments.filter(p => {
    const paidDate = new Date(p.created_date);
    const dueDate = new Date(p.payment_date);
    return paidDate <= dueDate;
  });

  const punctualityRate = paidPayments.length > 0 
    ? ((onTimePayments.length / paidPayments.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Überfällig</p>
                <p className="text-2xl font-bold text-red-600">
                  {totalOverdue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-slate-500 mt-1">{overduePayments.length} Zahlungen</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ausstehend</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalPending.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-slate-500 mt-1">{pendingPayments.length} Zahlungen</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bezahlt</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalPaid.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-slate-500 mt-1">{paidPayments.length} Zahlungen</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pünktlichkeit</p>
                <p className="text-2xl font-bold text-blue-600">{punctualityRate}%</p>
                <p className="text-xs text-slate-500 mt-1">Rechtzeitige Zahlungen</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Zahlungstrend (12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Zahlungen" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overdue Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Überfällige Zahlungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overduePayments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Keine überfälligen Zahlungen</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">Mieter</th>
                    <th className="text-left p-3 text-sm font-semibold">Fällig am</th>
                    <th className="text-right p-3 text-sm font-semibold">Betrag</th>
                    <th className="text-right p-3 text-sm font-semibold">Überfällig seit</th>
                    <th className="text-left p-3 text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overduePayments.slice(0, 20).map(payment => {
                    const dueDate = new Date(payment.payment_date);
                    const daysPast = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={payment.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm">
                          {getTenantName(payment.contract_id)}
                        </td>
                        <td className="p-3 text-sm">
                          {dueDate.toLocaleDateString('de-DE')}
                        </td>
                        <td className="p-3 text-sm text-right font-medium text-red-600">
                          {(payment.amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="p-3 text-sm text-right">
                          <Badge variant="destructive">{daysPast} Tage</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            Überfällig
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}