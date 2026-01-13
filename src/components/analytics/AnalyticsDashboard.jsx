import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('monthly');

  const { data: metrics = [] } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => base44.entities.Analytics?.list?.('-created_date', 20) || []
  });

  const chartData = metrics.length > 0 ? JSON.parse(metrics[0].data_points || '[]') : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Wöchentlich</SelectItem>
            <SelectItem value="monthly">Monatlich</SelectItem>
            <SelectItem value="quarterly">Quartal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map(metric => (
          <Card key={metric.id}>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">{metric.metric_name}</p>
                <p className="text-2xl font-bold">{metric.current_value.toLocaleString('de-DE')}</p>
                <div className="flex items-center gap-1">
                  {metric.trend >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={metric.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vergleich</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" fill="#10b981" />
                <Bar dataKey="actual" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}