import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award } from 'lucide-react';

export default function TenantScoring({ tenantId }) {
  const { data: score } = useQuery({
    queryKey: ['tenantScore', tenantId],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateTenantScore', { tenant_id: tenantId });
      return response.data;
    },
    enabled: !!tenantId
  });

  if (!score) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Mieter-Scoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-slate-600">Gesamt-Score</p>
          <Badge className="bg-blue-600 text-3xl">{score.total}/100</Badge>
        </div>
        {score.factors.map((factor, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span>{factor.name}</span>
              <span className="font-semibold">{factor.value}/100</span>
            </div>
            <Progress value={factor.value} />
          </div>
        ))}
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs font-semibold">Bewertung: {score.rating}</p>
          <p className="text-xs text-slate-600 mt-1">{score.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}