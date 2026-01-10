import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinanceDashboard({ buildingId }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-payment_date', 100)
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Invoice.list('-date', 100)
  });

  const totalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const monthStr = month.toISOString().slice(0, 7);
    
    return {
      month: month.toLocaleDateString('de-DE', { month: 'short' }),
      income: payments.filter(p => p.payment_date?.startsWith(monthStr)).reduce((s, p) => s + (p.amount || 0), 0),
      expenses: expenses.filter(e => e.date?.startsWith(monthStr)).reduce((s, e) => s + (e.amount || 0), 0)
    };
  }).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Finanzen (Letzte 6 Monate)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-900">Einnahmen</p>
            <p className="text-lg font-bold text-green-900">{totalIncome.toLocaleString('de-DE')}€</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-900">Ausgaben</p>
            <p className="text-lg font-bold text-red-900">{totalExpenses.toLocaleString('de-DE')}€</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">Gewinn</p>
            <p className="text-lg font-bold text-blue-900">{netProfit.toLocaleString('de-DE')}€</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="income" fill="#10b981" />
            <Bar dataKey="expenses" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}