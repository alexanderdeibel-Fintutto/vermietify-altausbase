import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { Shield } from 'lucide-react';

export default function PortfolioRiskAnalysis() {
  const { data: risk } = useQuery({
    queryKey: ['portfolioRisk'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzePortfolioRisk', {});
      return response.data;
    }
  });

  if (!risk) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Risiko-Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">Gesamt-Risiko</p>
          <Badge className={risk.level === 'low' ? 'bg-green-600' : risk.level === 'medium' ? 'bg-orange-600' : 'bg-red-600'}>
            {risk.level.toUpperCase()}
          </Badge>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={risk.factors}>
            <PolarGrid />
            <PolarAngleAxis dataKey="factor" />
            <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}