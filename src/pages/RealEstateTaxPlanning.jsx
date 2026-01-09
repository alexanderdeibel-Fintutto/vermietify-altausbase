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
import { Home, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function RealEstateTaxPlanning() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: analysis = {}, isLoading } = useQuery({
    queryKey: ['realEstateTaxAnalysis', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateRealEstateTaxAnalysis', {
        country,
        taxYear
      });
      return response.data?.analysis || {};
    },
    enabled: analyzing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏠 Immobilien-Steuer Planung</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Immobiliensteuern</p>
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
      ) : analyzing && analysis.content ? (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Immobilien</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{analysis.metrics.property_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Mieteinnahmen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(analysis.metrics.rental_income).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Steuern</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(analysis.metrics.tax_amount).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rental Income Analysis */}
          {analysis.content.rental_income_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  💰 Mieteinnahmen-Analyse
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(analysis.content.rental_income_analysis).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">€{Math.round(value).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Deductible Expenses */}
          {(analysis.content.deductible_expenses || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Abzugsfähige Kosten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.deductible_expenses.map((expense, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    <p className="font-medium">{expense.category}</p>
                    <p className="text-xs text-slate-600">€{Math.round(expense.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Depreciation Strategy */}
          {analysis.content.depreciation_strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📉 Abschreibungsstrategie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analysis.content.depreciation_strategy).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-blue-300 pl-3">
                    <p className="text-sm capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-600 mt-1">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Capital Gains */}
          {(analysis.content.capital_gains_considerations || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  📊 Kapitalgewinne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.capital_gains_considerations.map((consideration, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {consideration}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Entity Recommendation */}
          {analysis.content.entity_structure_recommendation && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">🏛️ Empfohlene Struktur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.content.entity_structure_recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {(analysis.content.action_items || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Aktionsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.action_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-blue-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Estimated Savings */}
          {analysis.content.estimated_annual_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Jährliche Einsparungen</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(analysis.content.estimated_annual_savings).toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-green-300" />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Analyse starten", um Ihre Immobiliensteuern zu optimieren
        </div>
      )}
    </div>
  );
}