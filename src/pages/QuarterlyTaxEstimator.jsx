import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function QuarterlyTaxEstimator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [ytdIncome, setYtdIncome] = useState('50000');
  const [ytdExpenses, setYtdExpenses] = useState('15000');
  const [estimatedFullYear, setEstimatedFullYear] = useState('200000');
  const [estimating, setEstimating] = useState(false);

  const { data: estimation = {}, isLoading } = useQuery({
    queryKey: ['quarterlyTaxEstimate', country, taxYear, ytdIncome, estimatedFullYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('estimateQuarterlyTaxes', {
        country,
        taxYear,
        yearToDateIncome: parseFloat(ytdIncome),
        yearToDateExpenses: parseFloat(ytdExpenses),
        estimatedFullYearIncome: parseFloat(estimatedFullYear)
      });
      return response.data?.estimation || {};
    },
    enabled: estimating
  });

  const quarterlyData = (estimation.quarterly_estimates || []).map(q => ({
    name: q.quarter,
    tax: q.estimated_tax,
    payment: q.payment_amount,
    cumulative: q.cumulative_paid
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Quartals-Steuerschätzer</h1>
        <p className="text-slate-500 mt-1">Schätzen Sie Ihre Steuerzahlungen für jedes Quartal</p>
      </div>

      {/* Input Form */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Eingaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={estimating}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={estimating}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">YTD Einkommen (€)</label>
              <Input
                type="number"
                value={ytdIncome}
                onChange={(e) => setYtdIncome(e.target.value)}
                disabled={estimating}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">YTD Ausgaben (€)</label>
              <Input
                type="number"
                value={ytdExpenses}
                onChange={(e) => setYtdExpenses(e.target.value)}
                disabled={estimating}
                placeholder="15000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Geschätztes Gesamtjahreseinkommen (€)</label>
              <Input
                type="number"
                value={estimatedFullYear}
                onChange={(e) => setEstimatedFullYear(e.target.value)}
                disabled={estimating}
                placeholder="200000"
              />
            </div>
          </div>

          <Button
            onClick={() => setEstimating(true)}
            disabled={estimating || !ytdIncome}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {estimating ? 'Wird berechnet...' : 'Schätzen'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Schätzung läuft...</div>
      ) : estimating && Object.keys(estimation).length > 0 ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Geschätzte Gesamtsteuer</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(estimation.full_year_projection || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Bereits gezahlte Steuern</p>
                <p className="text-2xl font-bold mt-2">
                  €{Math.round(estimation.total_withholding || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className={estimation.balance_at_year_end > 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Saldo am Jahresende</p>
                <p className={`text-2xl font-bold mt-2 ${estimation.balance_at_year_end > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  €{Math.round(estimation.balance_at_year_end || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quarterly Chart */}
          {quarterlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Quartalsübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tax" fill="#ef4444" name="Geschätzte Steuer" />
                    <Bar dataKey="payment" fill="#3b82f6" name="Zahlungsbetrag" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Quarterly Details */}
          {(estimation.quarterly_estimates || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Quartalsdetails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estimation.quarterly_estimates.map((q, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold">{q.quarter}</p>
                      <span className="text-xs text-slate-600">{q.due_date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-600">Geschätzte Steuer</p>
                        <p className="font-bold">€{Math.round(q.estimated_tax || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Zahlungsbetrag</p>
                        <p className="font-bold text-blue-600">€{Math.round(q.payment_amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Kumulativ</p>
                        <p className="font-bold">€{Math.round(q.cumulative_paid || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Adjustments */}
          {(estimation.adjustments_needed || []).length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Erforderliche Anpassungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {estimation.adjustments_needed.map((adj, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    {adj}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie Ihre Informationen ein und klicken Sie "Schätzen"
        </div>
      )}
    </div>
  );
}