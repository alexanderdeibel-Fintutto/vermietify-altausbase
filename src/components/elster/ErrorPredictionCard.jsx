import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ErrorPredictionCard({ submissionId }) {
  const [predictions, setPredictions] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  React.useEffect(() => {
    if (submissionId) {
      analyzePredictions();
    }
  }, [submissionId]);

  const analyzePredictions = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('predictSubmissionErrors', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setPredictions(response.data.predictions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!predictions) return null;

  const getRiskColor = (score) => {
    if (score < 30) return 'text-green-600 bg-green-50';
    if (score < 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Fehler-Prognose</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`text-center p-3 rounded-lg ${getRiskColor(predictions.risk_score)}`}>
          <div className="text-xs mb-1">Risiko-Score</div>
          <div className="text-2xl font-bold">{predictions.risk_score}%</div>
        </div>

        {predictions.potential_issues.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium">Potenzielle Probleme:</div>
            {predictions.potential_issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs p-2 bg-slate-50 rounded">
                <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium">{issue.issue}</div>
                  <div className="text-slate-600">{issue.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {predictions.recommendations.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium">Empfehlungen:</div>
            {predictions.recommendations.map((rec, idx) => (
              <div key={idx} className="text-xs text-slate-600">• {rec}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}