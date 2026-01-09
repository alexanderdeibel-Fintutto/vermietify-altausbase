import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb, Zap } from 'lucide-react';

export default function PredictiveAnalyticsPanel({ portfolio, performanceData = [] }) {
  if (!portfolio || portfolio.length === 0) return null;

  // Einfache lineare Regression für Trend
  const calculateTrend = (data) => {
    if (data.length < 2) return 0;
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, d) => sum + d.value_per_unit, 0) / n;
    const numerator = data.reduce((sum, d, i) => sum + (i - xMean) * (d.value_per_unit - yMean), 0);
    const denominator = data.reduce((sum, _, i) => sum + Math.pow(i - xMean, 2), 0);
    return denominator !== 0 ? numerator / denominator : 0;
  };

  const trend = calculateTrend(performanceData);
  const projectedValue = portfolio.reduce((sum, p) => sum + (p.current_value * p.quantity), 0) * (1 + trend * 0.3);

  // Forecast data
  const forecastData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    projected: projectedValue * Math.pow(1 + trend * 0.02, i)
  }));

  const insights = [
    trend > 0.02 ? '📈 Aufwärtstrend erkannt' : '📉 Abwärtstrend erkannt',
    portfolio.length > 10 ? '✅ Gut diversifiziert' : '⚠️ Begrenzte Diversifikation',
    portfolio.filter(p => p.status === 'active').length === portfolio.length ? '✅ Alle Positionen aktiv' : '⚠️ Inaktive Positionen vorhanden'
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Prognose (12 Monate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Monate', position: 'insideBottomRight', offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toFixed(0)}`} />
              <Line type="monotone" dataKey="projected" stroke="#10b981" name="Projizierter Wert" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.map((insight, i) => (
            <div key={i} className="text-sm p-3 bg-slate-50 rounded border">
              {insight}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}