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
import { TrendingUp, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function DividendOptimization() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [optimizing, setOptimizing] = useState(false);

  const { data: optimization = {}, isLoading } = useQuery({
    queryKey: ['dividendOptimization', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('optimizeDividendStrategy', {
        country,
        taxYear
      });
      return response.data || {};
    },
    enabled: optimizing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💰 Dividenden-Optimierung</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Dividendenstrategie für maximale Steuereffizienz</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="flex items-end">
          <button
            onClick={() => setOptimizing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
            disabled={optimizing}
          >
            Analysieren
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : optimizing && optimization.optimization_strategies ? (
        <>
          {/* Current Position */}
          {optimization.optimization_strategies && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Aktuelle Dividendenstrategie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimization.optimization_strategies.map((strategy, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2">
                    <p className="font-medium text-sm">{strategy.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{strategy.description}</p>
                    {strategy.estimated_annual_savings && (
                      <p className="text-xs font-bold text-green-600 mt-2">
                        💰 Einsparungen: €{Math.round(strategy.estimated_annual_savings).toLocaleString()}/Jahr
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timing Recommendations */}
          {(optimization.optimization_strategies?.timing_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  📅 Timing-Empfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.optimization_strategies.timing_recommendations.map((timing, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {timing}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Withholding Tax Optimization */}
          {optimization.optimization_strategies?.withholding_optimization && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Quellensteuer-Optimierung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(optimization.optimization_strategies.withholding_optimization).map(([key, value]) => (
                    <div key={key} className="border-l-4 border-green-300 pl-3">
                      <p className="text-sm capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-600 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Requirements */}
          {(optimization.optimization_strategies?.compliance_requirements || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ✓ Compliance-Anforderungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.optimization_strategies.compliance_requirements.map((req, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    ✓ {req}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Estimated Savings */}
          {optimization.optimization_strategies?.estimated_annual_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Jährliche Einsparungen</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(optimization.optimization_strategies.estimated_annual_savings).toLocaleString()}
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
          Klicken Sie "Analysieren", um Ihre Dividendenstrategie zu optimieren
        </div>
      )}
    </div>
  );
}