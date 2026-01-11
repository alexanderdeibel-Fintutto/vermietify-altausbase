import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Lightbulb, Zap } from 'lucide-react';

export default function LifecyclePredictions({ companyId }) {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['lifecycle-predictions', companyId],
    queryFn: async () => {
      const result = await base44.functions.invoke('predictDocumentLifecycle', {
        company_id: companyId
      });
      return result.data.predictions;
    }
  });

  if (isLoading) return <div className="text-center py-4">Analysiere...</div>;

  return (
    <div className="grid gap-4">
      {/* At Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Risiko-Dokumente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions?.at_risk_documents?.length > 0 ? (
            <div className="space-y-1">
              {predictions.at_risk_documents.slice(0, 5).map(id => (
                <Badge key={id} variant="destructive" className="text-xs">{id}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Keine Risiken erkannt</p>
          )}
        </CardContent>
      </Card>

      {/* Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Optimierungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {predictions?.optimization_suggestions?.slice(0, 3).map((s, i) => (
              <p key={i} className="text-xs text-slate-700">• {s}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            Automatisierung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {predictions?.automation_opportunities?.slice(0, 3).map((s, i) => (
              <p key={i} className="text-xs text-slate-700">• {s}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}