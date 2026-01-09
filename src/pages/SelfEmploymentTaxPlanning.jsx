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
import { Briefcase, Calculator, TrendingDown, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function SelfEmploymentTaxPlanning() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [grossIncome, setGrossIncome] = useState(50000);
  const [expenses, setExpenses] = useState(10000);
  const [planning, setPlanning] = useState(false);

  const { data: plan = {}, isLoading } = useQuery({
    queryKey: ['selfEmploymentTaxPlan', country, taxYear, grossIncome, expenses],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateSelfEmploymentTaxPlan', {
        country,
        taxYear,
        businessIncome: grossIncome,
        businessExpenses: expenses
      });
      return response.data?.plan || {};
    },
    enabled: planning
  });

  const netIncome = grossIncome - expenses;
  const quarterlies = plan.content?.quarterly_estimates || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💼 Selbstständigen-Steuer Planung</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Unternehmersteuern</p>
      </div>

      {/* Input Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Geschäftsdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={planning}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={planning}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Bruttoeinkommen (€)</label>
              <Input
                type="number"
                value={grossIncome}
                onChange={(e) => setGrossIncome(parseInt(e.target.value))}
                disabled={planning}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Geschäftsausgaben (€)</label>
              <Input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(parseInt(e.target.value))}
                disabled={planning}
              />
            </div>
          </div>

          <button
            onClick={() => setPlanning(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={planning}
          >
            {planning ? '⏳ Wird kalkuliert...' : 'Steuerplan erstellen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Plan wird erstellt...</div>
      ) : planning && plan.content ? (
        <>
          {/* Income Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Bruttoeinkommen</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">€{Math.round(grossIncome).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Nettoeinkommen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">€{Math.round(netIncome).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Gesamtsteuerbelastung</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round((plan.content.total_tax_liability || 0)).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                📊 Steueraufschlüsselung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span>Selbstständigensteuer</span>
                <span className="font-bold">€{Math.round(plan.content.self_employment_tax || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Einkommensteuer</span>
                <span className="font-bold">€{Math.round(plan.content.estimated_income_tax || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>Gesamtsteuer</span>
                <span>€{Math.round(plan.content.total_tax_liability || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quarterly Estimates */}
          {(quarterlies.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Vierteljährliche Zahlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {quarterlies.map((q, i) => (
                    <div key={i} className="text-center p-3 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600">Q{i + 1}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        €{Math.round(q).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deduction Opportunities */}
          {(plan.content.deduction_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Abzugsmöglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.content.deduction_opportunities.map((deduction, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    <p className="font-medium">{deduction.category}</p>
                    <p className="text-xs text-slate-600">€{Math.round(deduction.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Retirement Planning */}
          {plan.content.retirement_planning && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🏦 Altersvorsorge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(plan.content.retirement_planning).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {(plan.content.action_items || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Aktionsplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.content.action_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-blue-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Savings */}
          {plan.content.estimated_annual_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Einsparungen</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(plan.content.estimated_annual_savings).toLocaleString()}
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
          Füllen Sie Ihre Daten aus und klicken Sie "Steuerplan erstellen"
        </div>
      )}
    </div>
  );
}