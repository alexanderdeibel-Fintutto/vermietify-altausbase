import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PortfolioPerformanceChart({ data = [] }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('de-DE', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance-Entwicklung</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={formatDate}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="Portfolio-Wert"
            />
            <Line 
              type="monotone" 
              dataKey="costBasis" 
              stroke="#64748b" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Einstandswert"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}