import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ErrorPredictionCard({ submissionId }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) return;

    const loadPrediction = async () => {
      try {
        const response = await base44.functions.invoke('predictSubmissionErrors', {
          submission_id: submissionId
        });
        setPrediction(response.data);
      } catch (error) {
        console.log('Prediction failed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrediction();
  }, [submissionId]);

  if (loading) return <Card><CardContent className="pt-6 text-sm text-slate-500">Analysiere...</CardContent></Card>;
  if (!prediction) return null;

  const getRiskColor = (score) => {
    if (score < 20) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBg = (score) => {
    if (score < 20) return 'bg-green-50';
    if (score < 50) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Fehler-Vorhersage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score */}
        <div className={`p-3 rounded-lg ${getRiskBg(prediction.risk_score)}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Risiko-Score</span>
            <span className={`text-2xl font-bold ${getRiskColor(prediction.risk_score)}`}>
              {Math.round(prediction.risk_score)}%
            </span>
          </div>
        </div>

        {/* Predicted Errors */}
        {prediction.predicted_errors && prediction.predicted_errors.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Wahrscheinliche Fehler:</div>
            {prediction.predicted_errors.slice(0, 3).map((err, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium">{err.field}</div>
                  <div className="text-slate-600">{err.error_type} ({err.probability}% Wahrscheinlichkeit)</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Checks */}
        {prediction.recommended_checks && prediction.recommended_checks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Empfohlene Kontrollen:</div>
            <div className="flex flex-wrap gap-2">
              {prediction.recommended_checks.slice(0, 3).map((check, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {check}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}