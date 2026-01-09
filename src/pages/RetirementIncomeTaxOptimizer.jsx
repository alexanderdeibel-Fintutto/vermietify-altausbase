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
import { DollarSign, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function RetirementIncomeTaxOptimizer() {
  const [country, setCountry] = useState('DE');
  const [pensionIncome, setPensionIncome] = useState(30000);
  const [otherIncome, setOtherIncome] = useState(5000);
  const [age, setAge] = useState(67);
  const [maritalStatus, setMaritalStatus] = useState('married');
  const [optimizing, setOptimizing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['retirementTaxOptimization', country, pensionIncome, otherIncome, age, maritalStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('optimizeRetirementIncomeTax', {
        country,
        pensionIncome,
        otherIncome,
        age,
        maritalStatus
      });
      return response.data?.optimization || {};
    },
    enabled: optimizing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">👴 Renten-Steuer-Optimierer</h1>
        <p className="text-slate-500 mt-1">Minimieren Sie Ihre Renteneinkünfte-Steuerlast</p>
      </div>

      {/* Input Form */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Rentenprofil</CardTitle>
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
              <label className="text-sm font-medium">Familienstand</label>
              <Select value={maritalStatus} onValueChange={setMaritalStatus} disabled={optimizing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Alleinstehend</SelectItem>
                  <SelectItem value="married">Verheiratet</SelectItem>
                  <SelectItem value="widowed">Verwitwet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Alter</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                disabled={optimizing}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Renteneinkommen (€)</label>
              <Input
                type="number"
                value={pensionIncome}
                onChange={(e) => setPensionIncome(parseInt(e.target.value) || 0)}
                disabled={optimizing}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Sonstiges Einkommen (€)</label>
            <Input
              type="number"
              value={otherIncome}
              onChange={(e) => setOtherIncome(parseInt(e.target.value) || 0)}
              disabled={optimizing}
            />
          </div>

          <button
            onClick={() => setOptimizing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={optimizing}
          >
            {optimizing ? '⏳ Wird optimiert...' : 'Optimieren'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Optimierung läuft...</div>
      ) : optimizing && result.content ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Zu versteuerndes Einkommen</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(result.content.total_taxable_income || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Steuerlast</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(result.content.estimated_tax_liability || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            {result.content?.potential_savings && (
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-slate-600">Sparpotenzial</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    €{Math.round(result.content.potential_savings).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Deductions */}
          {(result.content?.available_deductions || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Verfügbare Abzüge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.available_deductions.map((ded, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded flex justify-between">
                    <span className="text-sm">{ded.name}</span>
                    <span className="font-bold text-blue-600">€{Math.round(ded.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optimization Strategies */}
          {(result.content?.optimization_strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Optimierungsstrategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.optimization_strategies.map((strategy, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Income Timing Plan */}
          {result.content?.income_timing_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Einkommens-Timing-Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(result.content.income_timing_plan).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium">€{Math.round(value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {(result.content?.action_items || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📋 Aktionsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.action_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie Ihre Renteninformationen ein und klicken Sie "Optimieren"
        </div>
      )}
    </div>
  );
}