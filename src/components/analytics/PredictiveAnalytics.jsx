import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';

export default function PredictiveAnalytics() {
  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('generatePredictions', {});
      return response.data;
    }
  });

  if (!predictions) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Predictive Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {predictions.insights.map((insight, idx) => (
          <div key={idx} className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-2">
              {insight.type === 'positive' ? (
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">{insight.title}</p>
                <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                <Badge className="mt-2 bg-purple-600">{insight.confidence}% Wahrscheinlichkeit</Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}