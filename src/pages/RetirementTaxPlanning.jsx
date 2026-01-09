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
import { TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function RetirementTaxPlanning() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [currentAge, setCurrentAge] = useState(45);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentIncome, setCurrentIncome] = useState(80000);
  const [savedAmount, setSavedAmount] = useState(500000);
  const [optimizing, setOptimizing] = useState(false);

  const { data: optimization = {}, isLoading } = useQuery({
    queryKey: ['retirementTaxOptimization', country, taxYear, currentAge, retirementAge, currentIncome, savedAmount],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateRetirementTaxOptimization', {
        country,
        taxYear,
        currentAge,
        retirementAge,
        currentIncome,
        savedAmount
      });
      return response.data?.optimization || {};
    },
    enabled: optimizing
  });

  const yearsToRetirement = retirementAge - currentAge;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏦 Altersvorsorge-Steuer Planung</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Steuer im Ruhestand</p>
      </div>

      {/* Input Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Ruhestandsprofil</CardTitle>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Aktuelles Alter</label>
              <Input
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(parseInt(e.target.value))}
                disabled={optimizing}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ruhestandsalter</label>
              <Input
                type="number"
                value={retirementAge}
                onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                disabled={optimizing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Aktuelles Jahreseinkommen (€)</label>
              <Input
                type="number"
                value={currentIncome}
                onChange={(e) => setCurrentIncome(parseInt(e.target.value))}
                disabled={optimizing}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ersparte Altersvorsorge (€)</label>
              <Input
                type="number"
                value={savedAmount}
                onChange={(e) => setSavedAmount(parseInt(e.target.value))}
                disabled={optimizing}
              />
            </div>
          </div>

          <button
            onClick={() => setOptimizing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={optimizing}
          >
            {optimizing ? '⏳ Wird optimiert...' : 'Optimierung berechnen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Optimierung läuft...</div>
      ) : optimizing && optimization.content ? (
        <>
          {/* Timeline Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Jahre bis Ruhestand</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{yearsToRetirement}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Aktuelle Altersvorsorge</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(savedAmount).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Einsparungen</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  €{Math.round(optimization.content?.estimated_annual_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contribution Strategies */}
          {(optimization.content?.contribution_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  💰 Beitragstrategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimization.content.contribution_strategies.map((strategy, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">{strategy.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{strategy.description}</p>
                    {strategy.annual_contribution_limit && (
                      <p className="text-xs font-bold text-green-600 mt-1">
                        Jahresgrenze: €{Math.round(strategy.annual_contribution_limit).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Conversion Opportunities */}
          {(optimization.content?.conversion_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Umwandlungsmöglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.content.conversion_opportunities.map((opp, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Withdrawal Strategy */}
          {optimization.content?.withdrawal_strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  📊 Auszahlungsstrategie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(optimization.content.withdrawal_strategy).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-purple-300 pl-3">
                    <p className="text-sm capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-600 mt-1">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Timeline */}
          {(optimization.content?.action_timeline || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  📅 Aktionsplan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.content.action_timeline.map((action, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Critical Dates */}
          {(optimization.content?.critical_dates || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">⏰ Wichtige Termine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.content.critical_dates.map((date, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {date}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihre Daten aus und klicken Sie "Optimierung berechnen"
        </div>
      )}
    </div>
  );
}