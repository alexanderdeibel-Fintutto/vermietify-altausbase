import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Lightbulb } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxPlanningAdvisor() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [projectedIncome, setProjectedIncome] = useState('');
  const [showStrategy, setShowStrategy] = useState(false);

  const { data: strategy = {}, isLoading } = useQuery({
    queryKey: ['taxStrategy', country, taxYear, projectedIncome],
    queryFn: async () => {
      if (!projectedIncome) return {};
      const response = await base44.functions.invoke('generateTaxPlanningStrategy', {
        country,
        taxYear,
        projectedIncome: parseFloat(projectedIncome)
      });
      return response.data?.strategy || {};
    },
    enabled: showStrategy && !!projectedIncome
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💡 Tax Planning Advisor</h1>
        <p className="text-slate-500 mt-1">AI-gestützte Steuerplanungs-Strategien</p>
      </div>

      {/* Input Section */}
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">📊 Planungs-Parameter</CardTitle>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR + 1)}>{CURRENT_YEAR + 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Projiziertes Einkommen (€)</label>
              <Input
                type="number"
                placeholder="z.B. 50000"
                value={projectedIncome}
                onChange={(e) => setProjectedIncome(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => setShowStrategy(true)}
            disabled={!projectedIncome}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Strategie Generieren
          </Button>
        </CardContent>
      </Card>

      {isLoading && showStrategy && (
        <div className="text-center py-8">⏳ Strategie wird generiert...</div>
      )}

      {showStrategy && strategy.strategy && (
        <>
          {/* Savings Summary */}
          {strategy.strategy?.estimated_tax_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Steuereinsparungen</p>
                    <p className="text-3xl font-bold text-green-600">
                      €{Math.round(strategy.strategy.estimated_tax_savings).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Income Optimization */}
          {(strategy.strategy?.income_optimization || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Einkommens-Optimierung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.strategy.income_optimization.map((opt, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="font-medium text-sm">{opt.strategy || opt.title}</p>
                    {opt.savings && (
                      <p className="text-xs text-blue-600 mt-1">
                        Potenzielle Ersparnis: €{Math.round(opt.savings).toLocaleString()}
                      </p>
                    )}
                    {opt.feasibility && (
                      <Badge className="mt-2 text-xs">{opt.feasibility}</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Deduction Strategies */}
          {(strategy.strategy?.deduction_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📝 Abzugs-Strategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.strategy.deduction_strategies.map((ded, i) => (
                  <div key={i} className="p-3 bg-amber-50 rounded border border-amber-200">
                    <p className="font-medium text-sm">{ded.deduction || ded.strategy}</p>
                    {ded.amount && (
                      <p className="text-xs text-amber-700 mt-1">
                        Max. Betrag: €{Math.round(ded.amount).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timing Strategies */}
          {(strategy.strategy?.timing_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⏰ Timing-Strategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.strategy.timing_strategies.map((timing, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="flex-shrink-0">→</span>
                    {timing}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quarterly Payments */}
          {(strategy.strategy?.quarterly_payments || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Vierteljährliche Zahlungen</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {strategy.strategy.quarterly_payments.map((payment, i) => (
                  <div key={i} className="p-3 bg-green-50 rounded border border-green-200 text-center">
                    <p className="text-xs text-slate-600">Q{i + 1}</p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      €{Math.round(payment.amount || 0).toLocaleString()}
                    </p>
                    {payment.due_date && (
                      <p className="text-xs text-slate-600 mt-1">Fällig: {payment.due_date}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Factors */}
          {(strategy.strategy?.risk_factors || []).length > 0 && (
            <Alert className="border-orange-300 bg-orange-50">
              <AlertDescription className="text-orange-900 text-sm">
                <strong>⚠️ Risiko-Faktoren:</strong>
                <ul className="mt-2 space-y-1">
                  {strategy.strategy.risk_factors.map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Implementation Timeline */}
          {strategy.strategy?.implementation_timeline && (
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-sm">📋 Umsetzungs-Zeitplan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                {strategy.strategy.implementation_timeline}
              </CardContent>
            </Card>
          )}

          {/* Key Decisions */}
          {(strategy.strategy?.key_decisions || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Kritische Entscheidungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.strategy.key_decisions.map((decision, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-purple-50 rounded border border-purple-200">
                    <span className="font-bold text-purple-600 flex-shrink-0">{i + 1}.</span>
                    {decision}
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