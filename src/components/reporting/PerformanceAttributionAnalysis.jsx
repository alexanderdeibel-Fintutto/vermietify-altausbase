import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function PerformanceAttributionAnalysis() {
  const { data: attribution } = useQuery({
    queryKey: ['performanceAttribution'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzePerformanceAttribution', {});
      return response.data;
    }
  });

  if (!attribution) return null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Performance-Attribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={attribution.sources} dataKey="contribution" nameKey="source" cx="50%" cy="50%" outerRadius={70}>
              {attribution.sources.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1 text-xs text-slate-600">
          {attribution.sources.map(src => (
            <p key={src.source}>• {src.source}: +{src.value}€</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}