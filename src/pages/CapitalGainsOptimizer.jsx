import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function CapitalGainsOptimizer() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [optimizing, setOptimizing] = useState(false);

  const { data: optimization = {}, isLoading } = useQuery({
    queryKey: ['capitalGainsOptimization', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('optimizeCapitalGains', {
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
        <h1 className="text-3xl font-bold">💰 Kapitalgewinne Optimierer</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Kapitalgewinnstrategie</p>
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
          <Button
            onClick={() => setOptimizing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={optimizing}
          >
            Analysieren
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : optimizing && optimization.current_position ? (
        <>
          {/* Current Position */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Aktuelle Position</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-l-4 border-green-300 pl-3">
                <p className="text-xs text-slate-600">Realisierte Gewinne</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  €{Math.round(optimization.current_position.realized_gains || 0).toLocaleString()}
                </p>
              </div>
              <div className="border-l-4 border-red-300 pl-3">
                <p className="text-xs text-slate-600">Verfügbare Verluste</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  €{Math.round(optimization.current_position.available_losses || 0).toLocaleString()}
                </p>
              </div>
              <div className="border-l-4 border-blue-300 pl-3">
                <p className="text-xs text-slate-600">Netto Position</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  €{Math.round((optimization.current_position.realized_gains || 0) - (optimization.current_position.available_losses || 0)).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Savings */}
          {optimization.estimated_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Einsparungen</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(optimization.estimated_savings).toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-green-300" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Strategies */}
          {(optimization.optimization_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Optimierungsstrategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimization.optimization_strategies.map((strategy, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2">
                    <p className="font-medium text-sm">{strategy.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{strategy.description}</p>
                    {strategy.potential_savings && (
                      <p className="text-xs font-bold text-green-600 mt-1">
                        Potential: €{Math.round(strategy.potential_savings).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Timeline */}
          {(optimization.implementation_timeline || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Umsetzungsfahrplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.implementation_timeline.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tax Consequences */}
          {(optimization.tax_consequences || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ⚠️ Steuerliche Folgen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.tax_consequences.map((consequence, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {consequence}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Notes */}
          {(optimization.compliance_notes || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✓ Compliance-Hinweise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.compliance_notes.map((note, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    ✓ {note}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Analysieren", um Ihre Kapitalgewinnstrategie zu optimieren
        </div>
      )}
    </div>
  );
}