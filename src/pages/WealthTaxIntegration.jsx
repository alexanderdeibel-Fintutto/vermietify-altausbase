import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Target, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function WealthTaxIntegration() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: analysis = {}, isLoading } = useQuery({
    queryKey: ['wealthTaxAnalysis', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateWealthTaxAnalysis', {
        country,
        taxYear
      });
      return response.data?.analysis || {};
    },
    enabled: analyzing
  });

  const chartData = analysis.metrics ? [
    { name: 'Vermögen', value: Math.round(analysis.metrics.portfolio_value) },
    { name: 'Steuern', value: Math.round(analysis.metrics.tax_amount) }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💎 Vermögen-Steuer Integration</h1>
        <p className="text-slate-500 mt-1">Verstehen Sie die Steuerwirkung auf Ihr Vermögen</p>
      </div>

      {/* Controls */}
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

      <button
        onClick={() => setAnalyzing(true)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
        disabled={analyzing}
      >
        {analyzing ? '⏳ Wird analysiert...' : 'Analyse starten'}
      </button>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : analyzing && analysis.metrics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Vermögenswert</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(analysis.metrics.portfolio_value).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Steuerzahlung</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(analysis.metrics.tax_amount).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Steuer-zu-Vermögens Ratio</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {Math.round(analysis.metrics.tax_efficiency_ratio * 100) / 100}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vermögen vs. Steuern</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: €${Math.round(value).toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Steuereffizienzbewertung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Steuereffizienz</span>
                        <span className="text-sm font-bold">
                          {Math.round((100 - analysis.metrics.tax_efficiency_ratio))}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.round((100 - analysis.metrics.tax_efficiency_ratio))} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tax Efficiency Metrics */}
          {analysis.content?.tax_efficiency_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Steuereffizienz-Metriken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analysis.content.tax_efficiency_metrics).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-blue-300 pl-3">
                    <p className="text-sm capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {typeof value === 'number' ? `€${Math.round(value).toLocaleString()}` : value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optimization Strategies */}
          {(analysis.content?.optimization_strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  💡 Optimierungsstrategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.optimization_strategies.map((strategy, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Succession Planning */}
          {(analysis.content?.succession_planning_notes || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🏛️ Nachfolgeplanung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.succession_planning_notes.map((note, i) => (
                  <div key={i} className="text-sm p-2 bg-purple-50 rounded">
                    • {note}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Wealth Preservation Estimate */}
          {analysis.content?.estimated_wealth_preservation && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Vermögenserhaltung</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(analysis.content.estimated_wealth_preservation).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-300" />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Analyse starten", um die Vermögens-Steuer-Integration zu analysieren
        </div>
      )}
    </div>
  );
}