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
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function QuarterlyTaxEstimator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [projectedIncome, setProjectedIncome] = useState(200000);
  const [estimating, setEstimating] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['quarterlyEstimate', country, taxYear, projectedIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('estimateQuarterlyTaxes', {
        country,
        tax_year: taxYear,
        projected_income: projectedIncome
      });
      return response.data?.estimate || {};
    },
    enabled: estimating
  });

  const chartData = (result.content?.quarterly_breakdown || []).map(q => ({
    quarter: q.quarter,
    payment: q.payment_amount
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Vierteljährliche Steuerschätzung</h1>
        <p className="text-slate-500 mt-1">Planen Sie Ihre vierteljährlichen Zahlungen</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {[CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Geschätztes Jahreseinkommen (€)</label>
              <Input
                type="number"
                value={projectedIncome}
                onChange={(e) => setProjectedIncome(parseInt(e.target.value) || 0)}
                disabled={estimating}
              />
            </div>
          </div>

          <Button
            onClick={() => setEstimating(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={estimating}
          >
            {estimating ? '⏳ Wird geschätzt...' : 'Schätzen'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird geschätzt...</div>
      ) : estimating && result.content ? (
        <>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-slate-600">Geschätzte Gesamtsteuerlast</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                €{Math.round(result.content?.total_annual_tax || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-600 mt-2">Durchschnittliche Quartalsrate: €{Math.round((result.content?.total_annual_tax || 0) / 4).toLocaleString()}</p>
            </CardContent>
          </Card>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Vierteljährliche Zahlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${Math.round(value).toLocaleString()}`} />
                    <Bar dataKey="payment" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(result.content?.quarterly_breakdown || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Zahlungsplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.quarterly_breakdown.map((q, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded flex justify-between">
                    <span className="font-medium">{q.quarter}</span>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">€{Math.round(q.payment_amount).toLocaleString()}</p>
                      {q.due_date && <p className="text-xs text-slate-600">Fällig: {new Date(q.due_date).toLocaleDateString('de-DE')}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.payment_methods || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">💳 Zahlungsmethoden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.payment_methods.map((method, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {method}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Geben Sie Parameter ein und klicken Sie "Schätzen"</div>
      )}
    </div>
  );
}