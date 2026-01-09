import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Globe, TrendingUp } from 'lucide-react';

export default function InternationalTaxComparison() {
  const [income, setIncome] = useState(100000);
  const [comparing, setComparing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['internationalTaxComparison', income],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateInternationalTaxComparison', {
        annual_income: income
      });
      return response.data?.comparison || {};
    },
    enabled: comparing
  });

  const chartData = (result.content?.country_breakdown || []).map(c => ({
    country: c.country,
    tax: c.total_tax
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🌍 Internationaler Steuervergleich</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie Steuersätze über Länder hinweg</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Eingaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Jahreseinkommen (€)</label>
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
              disabled={comparing}
            />
          </div>

          <Button
            onClick={() => setComparing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={comparing}
          >
            {comparing ? '⏳ Wird verglichen...' : 'Vergleichen'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird verglichen...</div>
      ) : comparing && result.content ? (
        <>
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Steuerlast nach Land</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${Math.round(value).toLocaleString()}`} />
                    <Bar dataKey="tax" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(result.content?.country_breakdown || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Detaillierter Vergleich</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.country_breakdown.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">{c.country}</span>
                      <span className="text-lg font-bold text-red-600">€{Math.round(c.total_tax).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Effektiver Steuersatz: {c.effective_rate}%</p>
                      <p>Nach Steuern: €{Math.round(c.net_income).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.content?.most_favorable && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Günstigste Option</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-bold">{result.content.most_favorable}</p>
              </CardContent>
            </Card>
          )}

          {(result.content?.insights || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  💡 Einblicke
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.insights.map((insight, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {insight}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Geben Sie Ihr Einkommen ein und klicken Sie "Vergleichen"</div>
      )}
    </div>
  );
}