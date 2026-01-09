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
import { Heart, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function CharitableDonationPlanner() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [plannedDonation, setPlannedDonation] = useState(5000);
  const [grossIncome, setGrossIncome] = useState(100000);
  const [planning, setPlanning] = useState(false);

  const { data: strategy = {}, isLoading } = useQuery({
    queryKey: ['charitableDonationStrategy', country, taxYear, plannedDonation, grossIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateCharitableDonationStrategy', {
        country,
        taxYear,
        plannedDonation,
        grossIncome
      });
      return response.data?.strategy || {};
    },
    enabled: planning
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">❤️ Wohltätigkeits-Spenden Planer</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Spendensteuer-Strategie</p>
      </div>

      {/* Input Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Spendenprofil</CardTitle>
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
              <label className="text-sm font-medium">Geplante Spenden (€)</label>
              <Input
                type="number"
                value={plannedDonation}
                onChange={(e) => setPlannedDonation(parseInt(e.target.value))}
                disabled={planning}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bruttoeinkommen (€)</label>
              <Input
                type="number"
                value={grossIncome}
                onChange={(e) => setGrossIncome(parseInt(e.target.value))}
                disabled={planning}
              />
            </div>
          </div>

          <button
            onClick={() => setPlanning(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={planning}
          >
            {planning ? '⏳ Wird optimiert...' : 'Strategie erstellen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Strategie wird erstellt...</div>
      ) : planning && strategy.content ? (
        <>
          {/* Tax Deduction Analysis */}
          {strategy.content?.tax_deduction_analysis && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ✓ Steuerabzug-Analyse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(strategy.content.tax_deduction_analysis).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-green-300 pl-3">
                    <p className="text-sm capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {typeof value === 'number' ? `€${Math.round(value).toLocaleString()}` : value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Donation Strategies */}
          {(strategy.content?.donation_strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Spenden-Strategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {strategy.content.donation_strategies.map((strat, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">{strat.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{strat.description}</p>
                    {strat.estimated_tax_benefit && (
                      <p className="text-xs font-bold text-green-600 mt-1">
                        Steuervorteil: €{Math.round(strat.estimated_tax_benefit).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timing Recommendations */}
          {(strategy.content?.timing_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Timing-Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.content.timing_recommendations.map((timing, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {timing}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documentation Checklist */}
          {(strategy.content?.documentation_checklist || []).length > 0 && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Dokumentations-Checkliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.content.documentation_checklist.map((doc, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    {doc}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Notes */}
          {(strategy.content?.compliance_notes || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  ⚠️ Compliance-Hinweise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.content.compliance_notes.map((note, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {note}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Estimated Tax Savings */}
          {strategy.content?.estimated_tax_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Steuereinsparungen</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(strategy.content.estimated_tax_savings).toLocaleString()}
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
          Füllen Sie Ihre Daten aus und klicken Sie "Strategie erstellen"
        </div>
      )}
    </div>
  );
}