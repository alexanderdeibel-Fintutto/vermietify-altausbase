import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function CashflowForecastPanel({ buildingId }) {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [months, setMonths] = useState(6);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateCashflowForecast', {
        buildingId,
        forecastMonths: months
      });

      setForecast(response.data.forecast);
      toast.success('Cashflow-Prognose erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!forecast ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Cashflow-Prognose
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Prognosezeitraum</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
              >
                <option value={3}>3 Monate</option>
                <option value={6}>6 Monate</option>
                <option value={12}>12 Monate</option>
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Prognostiziere...
                </>
              ) : (
                'Prognose erstellen'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg">Zusammenfassung ({forecast.forecast_period})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-600">Einnahmen (gesamt)</p>
                  <p className="text-xl font-bold text-green-600">
                    €{(forecast.summary.total_expected_income || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Ausgaben (gesamt)</p>
                  <p className="text-xl font-bold text-red-600">
                    €{(forecast.summary.total_expected_expenses || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-600">Netto-Cashflow</p>
                  <p className={`text-2xl font-bold ${
                    forecast.summary.total_net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    €{(forecast.summary.total_net_cashflow || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monatliche Prognose</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {forecast.monthly_forecasts?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{item.month}</span>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.net_cashflow >= 0 ? '+' : ''}€{(item.net_cashflow || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-slate-500">
                        Kumulativ: €{(item.cumulative_cashflow || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Assessment */}
          {forecast.liquidity_assessment && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Liquiditätsbewertung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">{forecast.liquidity_assessment}</p>
              </CardContent>
            </Card>
          )}

          {/* Risks & Opportunities */}
          <div className="grid md:grid-cols-2 gap-4">
            {forecast.risk_factors?.length > 0 && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-sm">⚠️ Risiken</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {forecast.risk_factors.map((risk, idx) => (
                      <li key={idx} className="text-sm text-red-900">• {risk}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {forecast.opportunities?.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm">💡 Chancen</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {forecast.opportunities.map((opp, idx) => (
                      <li key={idx} className="text-sm text-green-900">• {opp}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <Button onClick={() => setForecast(null)} variant="outline" className="w-full">
            Neue Prognose
          </Button>
        </div>
      )}
    </div>
  );
}