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

const CURRENT_YEAR = new Date().getFullYear();

export default function QuarterlyTaxEstimator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [projectedIncome, setProjectedIncome] = useState('');
  const [estimate, setEstimate] = useState(false);

  const { data: forecast = {}, isLoading } = useQuery({
    queryKey: ['quarterlyTax', country, taxYear, projectedIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('estimateQuarterlyTaxes', {
        country,
        taxYear,
        projectedIncome: projectedIncome ? parseFloat(projectedIncome) : null
      });
      return response.data?.estimation || {};
    },
    enabled: estimate && !!projectedIncome
  });

  const quarters = [
    { num: 'Q1', label: 'Januar - März', key: 'q1_payment' },
    { num: 'Q2', label: 'April - Juni', key: 'q2_payment' },
    { num: 'Q3', label: 'Juli - September', key: 'q3_payment' },
    { num: 'Q4', label: 'Oktober - Dezember', key: 'q4_payment' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Quarterly Tax Estimator</h1>
        <p className="text-slate-500 mt-1">Schätzen Sie Ihre vierteljährlichen Steuerzahlungen</p>
      </div>

      {/* Controls */}
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">💹 Schätzungs-Parameter</CardTitle>
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
              placeholder="z.B. 80000"
              value={projectedIncome}
              onChange={(e) => setProjectedIncome(e.target.value)}
            />
          </div>

          <Button
            onClick={() => setEstimate(true)}
            disabled={!projectedIncome}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Schätzung Berechnen
          </Button>
        </CardContent>
      </Card>

      {isLoading && estimate && (
        <div className="text-center py-8">⏳ Schätzung wird berechnet...</div>
      )}

      {estimate && forecast.forecast && (
        <>
          {/* Quarterly Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarters.map(q => {
              const amount = forecast.forecast[q.key] || 0;
              return (
                <Card key={q.num} className="border-2 border-blue-300 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="font-bold text-xl">{q.num}</p>
                      <p className="text-sm text-slate-600 mt-1">{q.label}</p>
                      <p className="text-3xl font-bold text-blue-600 mt-3">
                        €{Math.round(amount).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Card */}
          <Card className="border-2 border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Geschätzte Gesamtsteuer</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    €{Math.round(forecast.forecast?.total_estimated_tax || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Effektiver Steuersatz</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {(forecast.forecast?.effective_tax_rate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Dates */}
          {forecast.forecast?.payment_dates && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Zahlungstermine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(forecast.forecast.payment_dates).map(([quarter, date]) => (
                  <div key={quarter} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                    <span className="font-medium">{quarter.toUpperCase()}</span>
                    <Badge className="bg-blue-100 text-blue-800">{date}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Safe Harbor Notes */}
          {(forecast.forecast?.safe_harbor_notes || []).length > 0 && (
            <Alert className="border-green-300 bg-green-50">
              <AlertDescription className="text-sm">
                <strong>✅ Safe Harbor Hinweise:</strong>
                <ul className="mt-2 space-y-1">
                  {forecast.forecast.safe_harbor_notes.map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Risk Alerts */}
          {(forecast.forecast?.risk_alerts || []).length > 0 && (
            <Alert className="border-red-300 bg-red-50">
              <AlertDescription className="text-sm">
                <strong>⚠️ Risiko-Hinweise:</strong>
                <ul className="mt-2 space-y-1">
                  {forecast.forecast.risk_alerts.map((alert, i) => (
                    <li key={i}>• {alert}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {(forecast.forecast?.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {forecast.forecast.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-slate-50 rounded">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {rec}
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