import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceMetrics({ entityType = 'Invoice' }) {
  const { data: metrics } = useQuery({
    queryKey: ['performance-metrics', entityType],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculatePerformanceMetrics', {
        entityType: entityType
      });
      return response.data;
    }
  });

  if (!metrics) return null;

  const getStatus = (value, target) => {
    if (value >= target * 0.9) return 'success';
    if (value >= target * 0.7) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.kpis?.map((kpi, idx) => {
          const status = getStatus(kpi.value, kpi.target);
          return (
            <Card key={idx}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">{kpi.label}</span>
                  <Badge
                    className={
                      status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {status === 'success' ? '✓' : status === 'warning' ? '!' : '✕'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-slate-500">
                  Target: {kpi.target} {kpi.unit}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend Chart */}
      {metrics.trends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              Entwicklung (30 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Benchmark */}
      {metrics.benchmark && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4" />
              Benchmark-Vergleich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: 'Sie', value: metrics.benchmark.yourValue },
                  { name: 'Durchschnitt', value: metrics.benchmark.average },
                  { name: 'Top', value: metrics.benchmark.top }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}