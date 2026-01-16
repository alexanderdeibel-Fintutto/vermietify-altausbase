import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendAnalysisChart({ buildingId }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [metric, setMetric] = useState('rent');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateTrendAnalysisReport', {
        buildingId,
        metric,
        months: 12
      });

      setReport(response.data.report);
      toast.success('Trend-Analyse erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!report) return null;
    if (report.trend_direction === 'UP') return <TrendingUp className="w-6 h-6 text-green-600" />;
    if (report.trend_direction === 'DOWN') return <TrendingDown className="w-6 h-6 text-red-600" />;
    return <Minus className="w-6 h-6 text-slate-600" />;
  };

  return (
    <div className="space-y-4">
      {!report ? (
        <Card>
          <CardHeader>
            <CardTitle>Trend-Analyse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Metrik</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
              >
                <option value="rent">Mieteinnahmen</option>
                <option value="expenses">Ausgaben</option>
                <option value="occupancy">Belegungsquote</option>
                <option value="maintenance">Instandhaltungskosten</option>
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analysiere...
                </>
              ) : (
                'Analyse starten'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <Card className={`${
            report.trend_direction === 'UP' ? 'bg-green-50 border-green-200' :
            report.trend_direction === 'DOWN' ? 'bg-red-50 border-red-200' :
            'bg-slate-50 border-slate-200'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{report.metric}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon()}
                    <span className={`text-2xl font-bold ${
                      report.trend_direction === 'UP' ? 'text-green-600' :
                      report.trend_direction === 'DOWN' ? 'text-red-600' :
                      'text-slate-600'
                    }`}>
                      {report.percentage_change > 0 ? '+' : ''}{report.percentage_change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{report.period}</span>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {report.data_points && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={report.data_points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#1E3A8A" 
                      strokeWidth={2}
                      dot={{ fill: '#1E3A8A', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{report.analysis}</p>
            </CardContent>
          </Card>

          {/* Forecast */}
          {report.forecast_3months && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">3-Monats-Prognose</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.forecast_3months.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-slate-700">{item.month}</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{item.predicted_value?.toFixed(0)}</span>
                      <span className="text-xs text-slate-600 ml-2">({(item.confidence * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button onClick={() => setReport(null)} variant="outline" className="w-full">
            Neue Analyse
          </Button>
        </div>
      )}
    </div>
  );
}