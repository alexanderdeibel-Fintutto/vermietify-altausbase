import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, CheckCircle, Lightbulb } from 'lucide-react';

export default function TenantFeedbackAnalysisDashboard() {
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['feedback-insights'],
    queryFn: () => base44.entities.AIInsight.filter(
      { insight_type: 'sentiment_analysis' },
      '-generated_at',
      5
    ),
  });

  const latestInsight = insights[0];

  if (isLoading) {
    return <div className="h-48 bg-slate-100 rounded-lg animate-pulse" />;
  }

  if (!latestInsight) {
    return (
      <Card className="p-6">
        <p className="text-sm font-light text-slate-600">Keine Feedback-Analysen verfügbar.</p>
      </Card>
    );
  }

  const analysis = JSON.parse(latestInsight.ai_analysis || '{}');

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-light text-slate-900">Tenant-Feedback Analyse</h3>
          <p className="text-xs font-light text-slate-500 mt-1">
            Zuletzt aktualisiert: {new Date(latestInsight.generated_at).toLocaleDateString('de-DE')}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm font-light text-slate-900">{analysis.summary}</p>
        </div>

        {analysis.urgent_issues?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-light text-slate-900">Dringende Probleme</h4>
            </div>
            <div className="space-y-1">
              {analysis.urgent_issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
                  <span className="text-xs font-light text-red-700">• {issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.main_themes?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h4 className="font-light text-slate-900">Hauptthemen</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.main_themes.map((theme, idx) => (
                <Badge key={idx} className="bg-blue-100 text-blue-800 font-light">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.positives?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="font-light text-slate-900">Positive Erkenntnisse</h4>
            </div>
            <div className="space-y-1">
              {analysis.positives.map((positive, idx) => (
                <div key={idx} className="text-xs font-light text-green-700">
                  ✓ {positive}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.recommendations?.length > 0 && (
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h4 className="font-light text-slate-900">Verbesserungsempfehlungen</h4>
            </div>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 rounded border border-amber-200">
                  <span className="text-xs font-light text-amber-900 flex-1">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}