import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RevenueChartWidget() {
  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items'],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const income = financialItems.filter(item => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate >= monthStart && dueDate <= monthEnd && item.type === 'income';
      }).reduce((sum, item) => sum + (item.amount || 0), 0);

      months.push({
        month: format(date, 'MMM', { locale: de }),
        Umsatz: income
      });
    }
    
    return months;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={getMonthlyData()}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')}€`} />
        <Line type="monotone" dataKey="Umsatz" stroke="#10b981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}