import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, TrendingDown, Check } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxLossHarvesting() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [analyze, setAnalyze] = useState(false);

  const { data: analysis = {}, isLoading } = useQuery({
    queryKey: ['taxLossHarvesting', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('suggestTaxLossHarvesting', {
        country,
        taxYear
      });
      return response.data?.analysis || {};
    },
    enabled: analyze
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📉 Tax Loss Harvesting</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Vermögenssteuer durch strategische Verlustverrechnungen</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => setAnalyze(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Analysieren
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : analyze && Object.keys(analysis).length > 0 ? (
        <>
          {/* Current Position */}
          {analysis.current_position && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Aktuelle Position</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-l-4 border-green-300 pl-3">
                  <p className="text-xs text-slate-600">Realisierte Gewinne</p>
                  <p className="text-2xl font-bold text-green-600">€{Math.round(analysis.current_position.realized_gains || 0).toLocaleString()}</p>
                </div>
                <div className="border-l-4 border-red-300 pl-3">
                  <p className="text-xs text-slate-600">Realisierte Verluste</p>
                  <p className="text-2xl font-bold text-red-600">€{Math.round(analysis.current_position.realized_losses || 0).toLocaleString()}</p>
                </div>
                <div className="border-l-4 border-blue-300 pl-3">
                  <p className="text-xs text-slate-600">Unverrechnete Verluste</p>
                  <p className="text-2xl font-bold text-blue-600">€{Math.round(analysis.current_position.unused_losses || 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expected Tax Savings */}
          {analysis.expected_tax_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Erwartete Steuereinsparungen</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      €{Math.round(analysis.expected_tax_savings).toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Harvesting Opportunities */}
          {(analysis.harvesting_opportunities || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Harvest-Möglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.harvesting_opportunities.map((opp, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2">
                    <p className="font-medium text-sm">{opp.asset}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                      <div>
                        <p className="text-slate-600">Potential Loss</p>
                        <p className="font-bold">€{Math.round(opp.potential_loss || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Tax Benefit</p>
                        <p className="font-bold text-green-600">€{Math.round(opp.tax_benefit || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Wash Sale Warnings */}
          {(analysis.wash_sale_warnings || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ⚠️ Wash-Sale Risiken
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.wash_sale_warnings.map((warning, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    {warning}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {(analysis.implementation_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Umsetzungsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.implementation_steps.map((step, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded text-sm">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Notes */}
          {(analysis.compliance_notes || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  ✓ Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.compliance_notes.map((note, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    {note}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Analysieren", um Tax Loss Harvesting Möglichkeiten zu erkunden
        </div>
      )}
    </div>
  );
}