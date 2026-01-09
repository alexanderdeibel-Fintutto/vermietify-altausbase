import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SmartExpenseTracker() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [totalExpenses, setTotalExpenses] = useState(50000);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['smartExpenseAnalysis', country, taxYear, totalExpenses],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateSmartExpenseAnalysis', {
        country,
        taxYear,
        totalExpenses
      });
      return response.data?.analysis || {};
    },
    enabled: analyzing
  });

  const categoryData = (result.content?.expense_categories || []).slice(0, 5).map((cat, idx) => ({
    name: cat.name,
    value: cat.estimated_amount || 0,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💸 Intelligenter Ausgaben-Tracker</h1>
        <p className="text-slate-500 mt-1">Automatische Kategorisierung & Steuerabzüge</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Ausgabenprofil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={analyzing}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={analyzing}>
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

          <div>
            <label className="text-sm font-medium">Gesamtausgaben (€)</label>
            <Input
              type="number"
              value={totalExpenses}
              onChange={(e) => setTotalExpenses(parseInt(e.target.value))}
              disabled={analyzing}
            />
          </div>

          <button
            onClick={() => setAnalyzing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={analyzing}
          >
            {analyzing ? '⏳ Wird analysiert...' : 'Ausgaben analysieren'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : analyzing && result.content ? (
        <>
          {/* Deductible Summary */}
          {result.content?.deductible_summary && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Abzugsfähige Ausgaben</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.content.deductible_summary).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="p-2 bg-white rounded text-center">
                      <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-bold text-green-600 mt-1">€{Math.round(value).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown Chart */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Ausgabenkategorien</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: €${Math.round(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${Math.round(value)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tax Savings */}
          {result.content?.estimated_tax_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Geschätzte Steuereinsparungen</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(result.content.estimated_tax_savings).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Missed Deductions */}
          {(result.content?.missed_deductions || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Häufig übersehene Abzüge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.missed_deductions.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optimization Tips */}
          {(result.content?.optimization_tips || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Optimierungstipps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.optimization_tips.map((tip, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {tip}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie Ihre Ausgaben ein und klicken Sie "Ausgaben analysieren"
        </div>
      )}
    </div>
  );
}