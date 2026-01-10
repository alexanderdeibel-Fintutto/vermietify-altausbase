import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function WorkflowPredictions({ companyId }) {
  const { data: predictions = {}, isLoading } = useQuery({
    queryKey: ['workflow-predictions', companyId],
    queryFn: () =>
      base44.functions.invoke('predictWorkflowCompletion', {
        company_id: companyId,
        days_ahead: 7
      }).then(res => res.data)
  });

  if (isLoading) return <div className="text-center py-4">Analysiert Prognosen...</div>;

  const { active_predictions = [], daily_forecasts = [], baseline_metrics = {} } = predictions;

  // Filter high-risk items
  const atRisk = active_predictions.filter(p => p.delay_risk === 'high');

  return (
    <div className="space-y-4">
      {/* High Risk Alert */}
      {atRisk.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {atRisk.length} Workflow(s) mit hohem Verzögerungsrisiko
          </AlertDescription>
        </Alert>
      )}

      {/* Active Predictions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Aktive Workflow-Prognosen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active_predictions.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">Keine laufenden Workflows</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {active_predictions.map(pred => (
                <div key={pred.execution_id} className="p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{pred.workflow_id}</p>
                      <p className="text-xs text-slate-600">
                        Fortschritt: {pred.progress_percent}%
                      </p>
                    </div>
                    <Badge
                      variant={pred.delay_risk === 'high' ? 'destructive' : 'secondary'}
                      className={pred.delay_risk === 'high' ? '' : 'bg-green-100 text-green-700'}
                    >
                      {pred.delay_risk === 'high' ? '⚠️ Risiko' : '✓ Im Plan'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                    <div>
                      <p className="font-medium">Verbleibend</p>
                      <p className="text-slate-900 font-semibold">
                        {pred.estimated_remaining_minutes} Min
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Abschluss um</p>
                      <p className="text-slate-900">
                        {format(new Date(pred.estimated_completion), 'HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    Genauigkeit: {pred.confidence}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Forecast */}
      {daily_forecasts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">7-Tage-Prognose</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={daily_forecasts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  style={{ fontSize: '12px' }}
                  tickFormatter={(date) => format(new Date(date), 'dd.MM', { locale: de })}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value) => `${value} Ausführungen`}
                  labelFormatter={(date) => format(new Date(date), 'dd.MM.yyyy', { locale: de })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted_completions" 
                  stroke="#3b82f6" 
                  name="Prognostizierte Abschlüsse"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Baseline Metrics */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Baseline-Metriken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-600">Ø Ausführungszeit</p>
              <p className="text-2xl font-bold text-slate-900">
                {baseline_metrics.avg_execution_time} Min
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Standardabweichung</p>
              <p className="text-2xl font-bold text-slate-900">
                ±{baseline_metrics.std_deviation} Min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}