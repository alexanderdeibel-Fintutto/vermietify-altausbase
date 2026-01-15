import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyAnalyticsReportBuilder({ buildingId }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState('12months');

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generatePropertyAnalyticsReport', {
        buildingId,
        period
      });

      setReport(response.data.report);
      toast.success('Bericht generiert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!report ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Immobilien-Analysebericht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Zeitraum</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full mt-2 border rounded px-3 py-2 text-sm"
              >
                <option value="3months">Letzte 3 Monate</option>
                <option value="6months">Letzte 6 Monate</option>
                <option value="12months">Letzte 12 Monate</option>
              </select>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere Bericht...
                </>
              ) : (
                'Bericht generieren'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-700 mb-3">{report.summary}</p>
            </CardContent>
          </Card>

          {/* KPIs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leistungsindikatoren</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(report.kpis).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {typeof value === 'number' ? (key.includes('rate') ? `${value}%` : `€${value.toFixed(2)}`) : value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trends */}
          {report.trends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.trends.map((trend, idx) => (
                  <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-900">{trend.metric}</p>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        trend.direction === 'UP' ? 'bg-green-100 text-green-800' :
                        trend.direction === 'DOWN' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trend.direction} {trend.change !== undefined && `${trend.change > 0 ? '+' : ''}${trend.change}%`}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{trend.analysis}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {report.risk_assessment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Risikobewertung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.risk_assessment.map((risk, idx) => (
                  <div key={idx} className={`rounded-lg p-4 border-l-4 ${
                    risk.severity === 'HIGH' ? 'bg-red-50 border-red-400' :
                    risk.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-900">{risk.risk}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        risk.severity === 'HIGH' ? 'bg-red-200 text-red-900' :
                        risk.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-blue-200 text-blue-900'
                      }`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{risk.mitigation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Forecast */}
          {report.forecast_12months && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">12-Monats-Vorhersage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Projizierte Einnahmen</p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      €{(report.forecast_12months.projected_revenue || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Projizierte Kosten</p>
                    <p className="text-lg font-bold text-red-600 mt-1">
                      €{(report.forecast_12months.projected_costs || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Vakanzquote</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {(report.forecast_12months.projected_vacancy_rate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-blue-600 font-bold">→</span>
                      <span className="text-slate-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => setReport(null)}
            variant="outline"
            className="w-full"
          >
            Neuer Bericht
          </Button>
        </div>
      )}
    </div>
  );
}