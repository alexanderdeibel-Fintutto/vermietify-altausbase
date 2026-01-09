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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxPlanningAdvisor() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [projectedIncome, setProjectedIncome] = useState('');
  const [generatePlan, setGeneratePlan] = useState(false);

  const { data: strategy = {}, isLoading } = useQuery({
    queryKey: ['taxStrategy', country, taxYear, projectedIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxPlanningStrategy', {
        country,
        taxYear,
        projectedIncome: projectedIncome ? parseFloat(projectedIncome) : null
      });
      return response.data?.strategy || {};
    },
    enabled: generatePlan && !!projectedIncome
  });

  const quarterlyData = strategy.plan?.quarterly_plan 
    ? Object.entries(strategy.plan.quarterly_plan).map(([q, amount]) => ({
        name: q.toUpperCase(),
        amount: Math.round(amount)
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Tax Planning Advisor</h1>
        <p className="text-slate-500 mt-1">Personalisierte Steuerstrategie entwickeln</p>
      </div>

      {/* Input Section */}
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">📋 Planungs-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR + 1)}>{CURRENT_YEAR + 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Projiziertes Jahreseinkommen (€)</label>
            <Input
              type="number"
              placeholder="z.B. 100000"
              value={projectedIncome}
              onChange={(e) => setProjectedIncome(e.target.value)}
            />
          </div>

          <Button
            onClick={() => setGeneratePlan(true)}
            disabled={!projectedIncome}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Steuerstrategie Generieren
          </Button>
        </CardContent>
      </Card>

      {isLoading && generatePlan && (
        <div className="text-center py-8">⏳ Strategie wird entwickelt...</div>
      )}

      {generatePlan && strategy.plan && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Geschätzte Ersparnis</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(strategy.plan?.estimated_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Monatliches Sparziel</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  €{Math.round(strategy.plan?.monthly_savings_target || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Risiko-Level</p>
                <Badge className={`mt-2 ${
                  strategy.plan?.risk_level?.toLowerCase() === 'low'
                    ? 'bg-green-100 text-green-800'
                    : strategy.plan?.risk_level?.toLowerCase() === 'high'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {strategy.plan?.risk_level || 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Quarterly Payment Plan */}
          {quarterlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Vierteljährlicher Zahlungsplan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Income Strategies */}
          {(strategy.plan?.income_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Einkommens-Strategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.plan.income_strategies.map((strat, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-slate-50 rounded">
                    <span className="flex-shrink-0 text-blue-600">→</span>
                    {strat}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Deduction Opportunities */}
          {(strategy.plan?.deduction_opportunities || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Abzugs-Möglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.plan.deduction_opportunities.map((opp, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded border border-blue-200">
                    <p className="font-medium text-sm">{opp.title || opp.name || `Möglichkeit ${i + 1}`}</p>
                    {opp.description && <p className="text-xs text-slate-600 mt-1">{opp.description}</p>}
                    {opp.potential_savings && (
                      <p className="text-sm text-green-600 font-bold mt-2">💚 €{Math.round(opp.potential_savings).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Timeline */}
          {(strategy.plan?.implementation_timeline || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Umsetzungs-Zeitplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.plan.implementation_timeline.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-slate-50 rounded">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {step}
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