import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

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
          <AlertTriangle className="w-5 h-5" />
          Portfolio-Risiko-Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-slate-600">Gesamt-Risiko-Score</p>
          <Badge className="bg-orange-600 text-2xl">{risk.total_score}/100</Badge>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={risk.factors}>
            <PolarGrid />
            <PolarAngleAxis dataKey="factor" />
            <PolarRadiusAxis />
            <Radar name="Risiko" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="space-y-1 text-xs">
          {risk.recommendations.map((rec, idx) => (
            <p key={idx} className="text-slate-600">• {rec}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}