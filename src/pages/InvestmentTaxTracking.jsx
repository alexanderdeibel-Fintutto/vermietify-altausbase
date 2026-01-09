import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function InvestmentTaxTracking() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: tracking = {}, isLoading } = useQuery({
    queryKey: ['investmentTaxTracking', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('trackInvestmentTax', {
        country,
        taxYear
      });
      return response.data?.tracking || {};
    }
  });

  const netGains = (tracking.analysis?.total_capital_gains || 0) - (tracking.analysis?.total_capital_losses || 0);
  const taxLiability = tracking.analysis?.tax_liability || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📈 Investment Tax Tracking</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie die Besteuerung Ihrer Kapitalanlagen</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Lade Investment-Daten...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Gewinne</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(tracking.analysis?.total_capital_gains || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Verluste</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  -€{Math.round(tracking.analysis?.total_capital_losses || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Netto-Position</p>
                <p className={`text-2xl font-bold mt-2 ${netGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{Math.round(netGains).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Steuerlast</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  €{Math.round(taxLiability).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gains Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Gewinne - Detailanalyse</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-slate-600">Kurzfristige Gewinne</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  €{Math.round(tracking.analysis?.short_term_gains || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-slate-600">Langfristige Gewinne</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  €{Math.round(tracking.analysis?.long_term_gains || 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Harvesting Opportunities */}
          {(tracking.analysis?.harvesting_opportunities || []).length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm">🌾 Tax Loss Harvesting Möglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tracking.analysis.harvesting_opportunities.map((opp, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <Badge className="flex-shrink-0 bg-yellow-200 text-yellow-800 text-xs mt-0.5">
                      {i + 1}
                    </Badge>
                    <span>{opp}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Carryforward Summary */}
          {tracking.analysis?.carryforward_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Verlustvortrag-Status</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                {tracking.analysis.carryforward_summary}
              </CardContent>
            </Card>
          )}

          {/* Optimization Strategies */}
          {(tracking.analysis?.optimization_strategies || []).length > 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900 text-sm">
                <strong>💡 Optimierungs-Strategien:</strong>
                <ul className="mt-2 space-y-1">
                  {tracking.analysis.optimization_strategies.map((strategy, i) => (
                    <li key={i}>→ {strategy}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Documentation Checklist */}
          {(tracking.analysis?.documentation_checklist || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✅ Dokumentations-Checkliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tracking.analysis.documentation_checklist.map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-green-600 flex-shrink-0">☐</span>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}