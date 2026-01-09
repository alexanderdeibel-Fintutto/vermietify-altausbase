import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AnnualTaxReview() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [reviewing, setReviewing] = useState(false);

  const { data: review = {}, isLoading } = useQuery({
    queryKey: ['annualTaxReview', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAnnualTaxReview', {
        country,
        taxYear
      });
      return response.data?.review || {};
    },
    enabled: reviewing
  });

  const chartData = review.tax_comparison ? [
    {
      year: review.comparison_year,
      amount: review.tax_comparison.previous_year,
      name: 'Vorjahr'
    },
    {
      year: review.tax_year,
      amount: review.tax_comparison.current_year,
      name: 'Aktuelles Jahr'
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📈 Jahres-Steuer Review</h1>
        <p className="text-slate-500 mt-1">Umfassende Jahresanalyse und Jahresvergleich</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={reviewing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={reviewing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <button
        onClick={() => setReviewing(true)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
        disabled={reviewing}
      >
        {reviewing ? '⏳ Wird generiert...' : 'Review generieren'}
      </button>

      {isLoading ? (
        <div className="text-center py-8">⏳ Review wird erstellt...</div>
      ) : reviewing && review.tax_comparison ? (
        <>
          {/* Year-over-Year Comparison */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">💰 Jahresvergleich</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-600">{review.comparison_year}</p>
                  <p className="text-2xl font-bold mt-1">
                    €{Math.round(review.tax_comparison.previous_year).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  {review.tax_comparison.change >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-red-600" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-600">{review.tax_year}</p>
                  <p className="text-2xl font-bold mt-1">
                    €{Math.round(review.tax_comparison.current_year).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${
                  review.tax_comparison.change >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {review.tax_comparison.change >= 0 ? '+' : ''} €{Math.round(review.tax_comparison.change).toLocaleString()}
                  ({review.tax_comparison.percentage_change}%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Trend-Visualisierung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Steuerbetrag (€)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Executive Summary */}
          {review.content?.executive_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{review.content.executive_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Achievements */}
          {(review.content?.key_achievements || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Erreichte Ziele</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.content.key_achievements.map((achievement, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    ✓ {achievement}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {(review.content?.areas_for_improvement || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔧 Verbesserungsbereiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.content.areas_for_improvement.map((area, i) => (
                  <div key={i} className="text-sm p-2 bg-orange-50 rounded">
                    • {area}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(review.content?.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.content.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-blue-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Next Year Priorities */}
          {(review.content?.next_year_priorities || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  🎯 Prioritäten für nächstes Jahr
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.content.next_year_priorities.map((priority, i) => (
                  <div key={i} className="text-sm p-2 bg-purple-50 rounded flex gap-2">
                    <span className="text-purple-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {priority}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Strategic Outlook */}
          {review.content?.strategic_outlook && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔮 Strategischer Ausblick</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{review.content.strategic_outlook}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Review generieren", um eine umfassende Jahresanalyse zu erhalten
        </div>
      )}
    </div>
  );
}