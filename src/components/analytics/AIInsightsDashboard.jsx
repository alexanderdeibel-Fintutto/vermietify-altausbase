import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function AIInsightsDashboard({ entityType = 'Invoice' }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', entityType],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAIInsights', {
        entityType: entityType
      });
      return response.data;
    }
  });

  if (isLoading) {
    return <Card><CardContent className="p-6 text-center">🤖 AI analysiert Daten...</CardContent></Card>;
  }

  if (!insights) return null;

  return (
    <div className="space-y-4">
      {/* Key Insights */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.keyInsights?.map((insight, idx) => (
            <div key={idx} className="p-3 bg-white rounded border-l-4 border-l-purple-500">
              <p className="text-sm font-medium">{insight.title}</p>
              <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
              {insight.recommendation && (
                <p className="text-xs text-purple-700 font-medium mt-2">
                  💡 {insight.recommendation}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Anomalies */}
      {insights.anomalies && insights.anomalies.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Anomalien erkannt ({insights.anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.anomalies.map((anom, idx) => (
              <Alert key={idx} className="border-orange-200 bg-orange-50">
                <AlertDescription className="text-sm">
                  <strong>{anom.type}:</strong> {anom.description}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      {insights.predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Vorhersagen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.predictions.map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-sm">{pred.metric}</span>
                <span className={`font-bold ${pred.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {pred.trend === 'up' ? '↗' : '↘'} {pred.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}