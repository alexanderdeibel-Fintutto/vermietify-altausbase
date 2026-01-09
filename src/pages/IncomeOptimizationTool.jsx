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
import { TrendingUp, Target, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function IncomeOptimizationTool() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [totalIncome, setTotalIncome] = useState(100000);
  const [optimizing, setOptimizing] = useState(false);

  const { data: optimization = {}, isLoading } = useQuery({
    queryKey: ['incomeOptimization', country, taxYear, totalIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateIncomeOptimization', {
        country,
        taxYear,
        totalIncome
      });
      return response.data?.optimization || {};
    },
    enabled: optimizing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💰 Einkommensoptimierungs-Tool</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Einkommensbesteuerung</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Einkommensprofil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={optimizing}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={optimizing}>
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
            <label className="text-sm font-medium">Gesamteinkommen (€)</label>
            <Input
              type="number"
              value={totalIncome}
              onChange={(e) => setTotalIncome(parseInt(e.target.value))}
              disabled={optimizing}
            />
          </div>

          <button
            onClick={() => setOptimizing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={optimizing}
          >
            {optimizing ? '⏳ Wird optimiert...' : 'Optimierung durchführen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Optimierung läuft...</div>
      ) : optimizing && optimization.content ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Einsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(optimization.content?.estimated_annual_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Steuereffizienz</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {Math.round((optimization.content?.tax_efficiency_score || 0) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Strategien verfügbar</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {(optimization.content?.optimization_strategies || []).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Strategies */}
          {(optimization.content?.optimization_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  💡 Optimierungsstrategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimization.content.optimization_strategies.map((strategy, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">{strategy.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{strategy.description}</p>
                    {strategy.potential_savings && (
                      <p className="text-xs font-bold text-green-600 mt-1">
                        Potenzielle Einsparungen: €{Math.round(strategy.potential_savings).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Timeline */}
          {(optimization.content?.implementation_timeline || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Implementierungsplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.content.implementation_timeline.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risks & Considerations */}
          {(optimization.content?.risks_and_considerations || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Risiken & Überlegungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.content.risks_and_considerations.map((risk, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {risk}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihre Daten aus und klicken Sie "Optimierung durchführen"
        </div>
      )}
    </div>
  );
}