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
import { TrendingDown, CheckCircle2, BarChart3 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function DeductionMaximizationTool() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [grossIncome, setGrossIncome] = useState(100000);
  const [maximizing, setMaximizing] = useState(false);

  const { data: strategy = {}, isLoading } = useQuery({
    queryKey: ['deductionMaximization', country, taxYear, grossIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateDeductionMaximization', {
        country,
        taxYear,
        grossIncome
      });
      return response.data?.strategy || {};
    },
    enabled: maximizing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Abzug-Maximierungs-Tool</h1>
        <p className="text-slate-500 mt-1">Maximieren Sie Ihre Steuerabzüge</p>
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
              <Select value={country} onValueChange={setCountry} disabled={maximizing}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={maximizing}>
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
            <label className="text-sm font-medium">Bruttoeinkommen (€)</label>
            <Input
              type="number"
              value={grossIncome}
              onChange={(e) => setGrossIncome(parseInt(e.target.value))}
              disabled={maximizing}
            />
          </div>

          <button
            onClick={() => setMaximizing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={maximizing}
          >
            {maximizing ? '⏳ Wird analysiert...' : 'Analyse durchführen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : maximizing && strategy.content ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Gesamtabzüge</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(strategy.content?.estimated_total_deductions || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Steuereinsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(strategy.content?.estimated_tax_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Verfügbare Abzüge</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {(strategy.content?.available_deductions || []).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Standard vs Itemized */}
          {strategy.content?.standard_vs_itemized && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  📊 Standard vs. Aufgelistet
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(strategy.content.standard_vs_itemized).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">€{Math.round(value).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Available Deductions */}
          {(strategy.content?.available_deductions || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Verfügbare Abzüge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {strategy.content.available_deductions.map((deduction, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">{deduction.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{deduction.description}</p>
                    {deduction.estimated_amount && (
                      <p className="text-xs font-bold text-blue-600 mt-1">
                        Geschätzt: €{Math.round(deduction.estimated_amount).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommended Approach */}
          {strategy.content?.recommended_deduction_approach && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Empfohlener Ansatz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{strategy.content.recommended_deduction_approach}</p>
              </CardContent>
            </Card>
          )}

          {/* Documentation Checklist */}
          {(strategy.content?.documentation_checklist || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✓ Dokumentationscheckliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.content.documentation_checklist.map((doc, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {doc}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihre Daten aus und klicken Sie "Analyse durchführen"
        </div>
      )}
    </div>
  );
}