import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDeductionOptimizer() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [income, setIncome] = useState('100000');
  const [optimize, setOptimize] = useState(false);

  const { data: optimization = {}, isLoading } = useQuery({
    queryKey: ['taxOptimization', country, taxYear, income],
    queryFn: async () => {
      const response = await base44.functions.invoke('optimizeTaxDeductionsAdvanced', {
        country,
        taxYear,
        income: parseFloat(income),
        expenses: {},
        assets: {}
      });
      return response.data?.optimization || {};
    },
    enabled: optimize && !!income
  });

  const analysis = optimization.analysis || {};
  const deductions = analysis.available_deductions || [];
  
  const totalPotentialDeductions = deductions.reduce((sum, d) => sum + (d.potential_savings || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Steuerabzug Optimizer</h1>
        <p className="text-slate-500 mt-1">Maximieren Sie Ihre Steuerabzüge und Ersparnisse</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Input
                type="number"
                value={taxYear}
                onChange={(e) => setTaxYear(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jahreseinkommen (€)</label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="100000"
              />
            </div>
          </div>

          <Button
            onClick={() => setOptimize(true)}
            disabled={!income}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Optimierung Durchführen
          </Button>
        </CardContent>
      </Card>

      {isLoading && optimize && (
        <div className="text-center py-8">⏳ Optimierung wird durchgeführt...</div>
      )}

      {optimize && analysis.available_deductions && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Sparpotenzial</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(analysis.estimated_tax_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Effektive Steuerquote Vorher</p>
                <p className="text-2xl font-bold mt-2">{Math.round(analysis.effective_tax_rate_before || 0)}%</p>
              </CardContent>
            </Card>
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Effektive Steuerquote Nachher</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{Math.round(analysis.effective_tax_rate_after || 0)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Verfügbare Steuerabzüge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deductions.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Keine Abzüge gefunden</p>
              ) : (
                deductions.map((ded, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-4 py-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm">{ded.category}</h4>
                      <Badge className="bg-green-100 text-green-800">
                        +€{Math.round(ded.potential_savings || 0).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-600">Aktuell</p>
                        <p className="font-bold">€{Math.round(ded.current_amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Optimiert</p>
                        <p className="font-bold text-green-600">€{Math.round(ded.optimized_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    {ded.implementation && (
                      <p className="text-xs text-slate-600 mt-2">💡 {ded.implementation}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Overlooked Opportunities */}
          {(analysis.overlooked_opportunities || []).length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Oft übersehene Möglichkeiten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.overlooked_opportunities.map((opp, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <span className="text-yellow-600 font-bold">!</span>
                    {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {(analysis.implementation_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📍 Umsetzungsschritte</CardTitle>
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

          {/* Risk Level */}
          {analysis.risk_level && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risiko-Level</span>
                  <Badge className={
                    analysis.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                    analysis.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {analysis.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Year Strategies */}
          {(analysis.next_year_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🚀 Strategien für nächstes Jahr</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.next_year_strategies.map((strat, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {strat}
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