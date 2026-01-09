import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export default function AIInsightsPanel({ insights }) {
  if (!insights) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine AI-Insights verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="summary">Zusammenfassung</TabsTrigger>
        <TabsTrigger value="anomalies">Anomalien</TabsTrigger>
        <TabsTrigger value="forecast">Prognose</TabsTrigger>
        <TabsTrigger value="takeaways">Erkenntnisse</TabsTrigger>
      </TabsList>

      {/* Executive Summary Tab */}
      <TabsContent value="summary" className="space-y-4 mt-4">
        {insights.executive_summary && (
          <>
            {/* Overview */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Übersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-900">{insights.executive_summary.overview}</p>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            {insights.executive_summary.key_metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Wichtigste KPIs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {insights.executive_summary.key_metrics.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200"
                    >
                      <div>
                        <p className="font-semibold text-sm">{kpi.metric}</p>
                        <p className="text-xs text-slate-600">{kpi.value}</p>
                      </div>
                      <Badge className={
                        kpi.status === 'positive' ? 'bg-green-100 text-green-800' :
                        kpi.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }>
                        {kpi.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Trends */}
            {insights.executive_summary.trends && insights.executive_summary.trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {insights.executive_summary.trends.map((trend, idx) => (
                    <p key={idx} className="text-sm text-slate-700">• {trend}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </TabsContent>

      {/* Anomalies Tab */}
      <TabsContent value="anomalies" className="space-y-4 mt-4">
        {insights.ai_analysis?.analysis && insights.ai_analysis.analysis.length > 0 ? (
          <div className="space-y-3">
            {insights.ai_analysis.analysis.map((anomaly, idx) => (
              <Card
                key={idx}
                className={
                  anomaly.severity === 'high' ? 'border-red-200 bg-red-50' :
                  anomaly.severity === 'medium' ? 'border-amber-200 bg-amber-50' :
                  'border-blue-200 bg-blue-50'
                }
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                      anomaly.severity === 'high' ? 'text-red-600' :
                      anomaly.severity === 'medium' ? 'text-amber-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">{anomaly.anomaly_type}</p>
                        <Badge className={
                          anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                          anomaly.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {anomaly.severity}
                        </Badge>
                      </div>

                      {anomaly.likely_causes && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Mögliche Ursachen:</p>
                          {anomaly.likely_causes.map((cause, cidx) => (
                            <p key={cidx} className="text-xs text-slate-700">• {cause}</p>
                          ))}
                        </div>
                      )}

                      {anomaly.recommended_actions && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Empfohlene Maßnahmen:</p>
                          {anomaly.recommended_actions.map((action, aidx) => (
                            <p key={aidx} className="text-xs text-slate-700">• {action}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-900">Keine Anomalien erkannt</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Forecast Tab */}
      <TabsContent value="forecast" className="space-y-4 mt-4">
        {insights.forecast ? (
          <div className="space-y-3">
            {insights.forecast.income_forecast && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Einnahmsprognose</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {insights.forecast.income_forecast.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm font-semibold">Periode {item.period}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{item.amount.toLocaleString('de-DE')} €</p>
                        <p className="text-xs text-slate-600">Konfidenz: {item.confidence}%</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {insights.forecast.assumptions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-sm">Annahmen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {insights.forecast.assumptions.map((assumption, idx) => (
                    <p key={idx} className="text-sm text-slate-700">• {assumption}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            {insights.forecast.risk_factors && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-base text-sm">Risikofaktoren</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {insights.forecast.risk_factors.map((risk, idx) => (
                    <p key={idx} className="text-sm text-amber-900">• {risk}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="bg-slate-50">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-slate-600">Keine Prognose verfügbar</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Takeaways Tab */}
      <TabsContent value="takeaways" className="space-y-4 mt-4">
        {insights.key_takeaways && insights.key_takeaways.length > 0 ? (
          <div className="space-y-2">
            {insights.key_takeaways.map((takeaway, idx) => (
              <Alert key={idx} className="bg-slate-50">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-sm text-slate-700">
                  {takeaway}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-50">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-slate-600">Keine Erkenntnisse verfügbar</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Recommendations */}
      {insights.executive_summary?.recommendations && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold text-sm text-green-900 mb-2">Empfehlungen</p>
          <ul className="space-y-1">
            {insights.executive_summary.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-green-800">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </Tabs>
  );
}