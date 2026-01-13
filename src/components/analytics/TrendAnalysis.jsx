import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendAnalysis({ entityType = 'Invoice' }) {
  const [period, setPeriod] = useState('6months');

  const { data: analysis } = useQuery({
    queryKey: ['trend-analysis', entityType, period],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeTrends', {
        entityType: entityType,
        period: period
      });
      return response.data;
    }
  });

  if (!analysis) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trendanalyse
          </span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Monate</SelectItem>
              <SelectItem value="6months">6 Monate</SelectItem>
              <SelectItem value="12months">12 Monate</SelectItem>
              <SelectItem value="all">Alle Zeiten</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Chart */}
        {analysis.data && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analysis.data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Insights */}
        <div className="grid grid-cols-2 gap-3">
          {analysis.insights?.map((insight, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded space-y-1">
              <div className="flex items-center gap-2">
                {insight.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs font-medium text-slate-600">{insight.metric}</span>
              </div>
              <p className={`text-sm font-bold ${
                insight.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {insight.change}
              </p>
              <p className="text-xs text-slate-500">{insight.description}</p>
            </div>
          ))}
        </div>

        {/* Forecast */}
        {analysis.forecast && (
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-900">📊 Vorhersage</p>
            <p className="text-xs text-blue-800 mt-1">{analysis.forecast.description}</p>
            <p className="text-sm font-bold text-blue-900 mt-2">
              {analysis.forecast.trend === 'up' ? '↗' : '↘'} {analysis.forecast.value}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}