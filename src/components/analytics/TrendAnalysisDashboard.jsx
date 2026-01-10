import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TrendAnalysisDashboard() {
  const { data: trends } = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeTrends', {});
      return response.data;
    }
  });

  if (!trends) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend-Analyse</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="wealth" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="tax" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}