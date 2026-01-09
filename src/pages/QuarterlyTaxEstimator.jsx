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
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function QuarterlyTaxEstimator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [projectedIncome, setProjectedIncome] = useState('');

  const { data: estimates = {}, isLoading, refetch } = useQuery({
    queryKey: ['quarterlyEstimates', country, taxYear, projectedIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('estimateQuarterlyTaxes', {
        country,
        taxYear,
        projectedIncome: parseFloat(projectedIncome) || 0
      });
      return response.data?.estimates || {};
    },
    enabled: !!projectedIncome
  });

  const getQuarterLabel = (quarter) => {
    const months = {
      1: 'Q1 (Jan-Mar)',
      2: 'Q2 (Apr-Jun)',
      3: 'Q3 (Jul-Sep)',
      4: 'Q4 (Okt-Dez)'
    };
    return months[quarter] || `Q${quarter}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Quarterly Tax Estimator</h1>
        <p className="text-slate-500 mt-1">Planen Sie Ihre vierteljährlichen Steuerzahlungen</p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Schätzungen konfigurieren</CardTitle>
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
                  <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR + 1)}>{CURRENT_YEAR + 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Geplantes Jahreseinkommen (€)</label>
              <Input
                type="number"
                placeholder="z.B. 50000"
                value={projectedIncome}
                onChange={(e) => setProjectedIncome(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Berechne Schätzungen...</div>
      ) : projectedIncome && estimates.schedule ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Geschätzte Gesamtsteuer</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(estimates.schedule.total_estimated_tax || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Effektiver Steuersatz</p>
                <p className="text-2xl font-bold mt-2">
                  {estimates.schedule.estimated_effective_rate || 0}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Quarterly Zahlungen</p>
                <p className="text-2xl font-bold mt-2">4</p>
              </CardContent>
            </Card>
          </div>

          {/* Quarterly Payments */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold">📅 Zahlungsplan</h2>
            {(estimates.schedule.quarterly_payments || []).map((payment, idx) => (
              <Card key={idx} className={`border-l-4 ${
                idx === 0 ? 'border-l-red-500' :
                idx === 1 ? 'border-l-orange-500' :
                idx === 2 ? 'border-l-yellow-500' :
                'border-l-green-500'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{getQuarterLabel(payment.quarter)}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Fällig: {new Date(payment.due_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        €{Math.round(payment.payment_amount || 0).toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Kumulativ: €{Math.round(payment.cumulative_amount || 0).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Adjustment Scenarios */}
          {(estimates.schedule.adjustment_scenarios || []).length > 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900 text-sm">
                <strong>💡 Anpassungs-Szenarien:</strong>
                <ul className="mt-2 space-y-1">
                  {estimates.schedule.adjustment_scenarios.map((scenario, i) => (
                    <li key={i}>• {scenario}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {(estimates.schedule.recommendations || []).length > 0 && (
            <Alert className="border-green-300 bg-green-50">
              <AlertDescription className="text-green-900 text-sm">
                <strong>✅ Empfehlungen:</strong>
                <ul className="mt-2 space-y-1">
                  {estimates.schedule.recommendations.map((rec, i) => (
                    <li key={i}>→ {rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <Card className="text-center py-8 text-slate-500">
          Geben Sie ein geplantes Jahreseinkommen ein, um Schätzungen zu sehen
        </Card>
      )}
    </div>
  );
}