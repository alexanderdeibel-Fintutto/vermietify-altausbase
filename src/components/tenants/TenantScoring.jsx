import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';

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
          <Star className="w-5 h-5" />
          Mieter-Scoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-slate-600">Gesamt-Score</p>
          <p className="text-4xl font-bold text-blue-900">{score.total_score}/100</p>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Zahlungsmoral</span>
              <span>{score.payment_score}/100</span>
            </div>
            <Progress value={score.payment_score} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Kommunikation</span>
              <span>{score.communication_score}/100</span>
            </div>
            <Progress value={score.communication_score} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Pflegezustand</span>
              <span>{score.maintenance_score}/100</span>
            </div>
            <Progress value={score.maintenance_score} />
          </div>
        </div>
        <Badge className={score.risk_level === 'low' ? 'bg-green-600' : 'bg-orange-600'}>
          Risiko: {score.risk_level}
        </Badge>
      </CardContent>
    </Card>
  );
}