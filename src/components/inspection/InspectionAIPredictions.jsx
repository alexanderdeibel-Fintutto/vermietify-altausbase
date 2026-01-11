import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

export default function InspectionAIPredictions({ buildingId }) {
  const [predictions, setPredictions] = useState(null);

  const predictMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiInspectionAnalysis', {
        action: 'predict_maintenance_needs',
        building_id: buildingId
      }),
    onSuccess: (response) => setPredictions(response.data.predictions)
  });

  const confidenceColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          KI-Wartungsvorhersage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => predictMutation.mutate()}
          disabled={predictMutation.isPending}
          className="w-full"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Wartungsbedarf vorhersagen
        </Button>

        {predictions && (
          <div className="space-y-4">
            {predictions.predicted_maintenance_needs?.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Vorhergesagter Wartungsbedarf</p>
                <div className="space-y-2">
                  {predictions.predicted_maintenance_needs.map((need, i) => (
                    <div key={i} className="p-3 bg-slate-50 border rounded">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{need.system}</h4>
                        <Badge className={confidenceColors[need.confidence]}>
                          {need.confidence}
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1">
                        <p><strong>Zeitrahmen:</strong> {need.predicted_timeframe}</p>
                        <p><strong>Kosten:</strong> {need.estimated_cost}</p>
                        <p className="text-slate-600">{need.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {predictions.priority_actions?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-medium text-sm text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Prioritäre Maßnahmen
                </p>
                <ul className="space-y-1">
                  {predictions.priority_actions.map((action, i) => (
                    <li key={i} className="text-xs text-red-700">• {action}</li>
                  ))}
                </ul>
              </div>
            )}

            {predictions.preventive_recommendations?.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-medium text-sm text-green-900 mb-2">Präventive Empfehlungen</p>
                <ul className="space-y-1">
                  {predictions.preventive_recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-green-700">✓ {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}