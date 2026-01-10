import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function MonthlyTaxEstimate() {
  const { data: financialItems = [] } = useQuery({
    queryKey: ['financialItems'],
    queryFn: () => base44.entities.FinancialItem.list('-date', 500)
  });

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthItems = financialItems.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() + 1 === month && d.getFullYear() === new Date().getFullYear();
    });

    const income = monthItems.filter(i => i.type === 'income').reduce((s, i) => s + (i.amount || 0), 0);
    const expenses = monthItems.filter(i => i.type === 'expense').reduce((s, i) => s + (i.amount || 0), 0);
    const profit = income - expenses;
    const estimatedTax = profit > 0 ? profit * 0.35 : 0;

    return {
      month: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][i],
      tax: Math.round(estimatedTax)
    };
  });

  const yearlyTotal = monthlyData.reduce((sum, m) => sum + m.tax, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Monatliche Steuerschätzung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">Geschätzte Jahressteuerlast</p>
          <p className="text-3xl font-bold text-blue-900">{yearlyTotal.toLocaleString('de-DE')} €</p>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tax" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}