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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxBracketCalculator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [income, setIncome] = useState(100000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [calculating, setCalculating] = useState(false);

  const { data: calculation = {}, isLoading } = useQuery({
    queryKey: ['marginalTaxRate', country, taxYear, income, filingStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateMarginalTaxRate', {
        country,
        taxYear,
        income,
        filingStatus
      });
      return response.data?.calculation || {};
    },
    enabled: calculating
  });

  const chartData = calculation.content?.tax_brackets ? 
    calculation.content.tax_brackets.map(bracket => ({
      range: `€${Math.round(bracket.lower || 0).toLocaleString()}-${bracket.upper ? Math.round(bracket.upper).toLocaleString() : '∞'}`,
      rate: bracket.rate || 0
    })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Steuerklammerrechner</h1>
        <p className="text-slate-500 mt-1">Berechnen Sie Ihre Grenzsteuersätze und effektive Sätze</p>
      </div>

      {/* Input Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Einkommensprofil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={calculating}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={calculating}>
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
              <label className="text-sm font-medium">Jahreseinkommen (€)</label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value))}
                disabled={calculating}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Steuerstatus</label>
              <Select value={filingStatus} onValueChange={setFilingStatus} disabled={calculating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Ledig</SelectItem>
                  <SelectItem value="married">Verheiratet</SelectItem>
                  <SelectItem value="divorced">Geschieden</SelectItem>
                  <SelectItem value="widowed">Verwitwet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            onClick={() => setCalculating(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={calculating}
          >
            {calculating ? '⏳ Wird berechnet...' : 'Berechnen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Berechnung läuft...</div>
      ) : calculating && calculation.content ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Grenzsteuersatz</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {Math.round((calculation.content.marginal_rate || 0) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Effektiver Steuersatz</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {Math.round((calculation.content.effective_rate || 0) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Gesamtsteuerbelastung</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  €{Math.round(calculation.content.total_tax_liability || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Brackets Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Steuerklammerenübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
                    <YAxis label={{ value: 'Steuersatz (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `${Math.round(value)}%`} />
                    <Bar dataKey="rate" fill="#3b82f6" name="Steuersatz" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tax Brackets Details */}
          {(calculation.content?.tax_brackets || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Steuerklassen Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {calculation.content.tax_brackets.map((bracket, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-sm">
                      €{Math.round(bracket.lower || 0).toLocaleString()} - €{bracket.upper ? Math.round(bracket.upper).toLocaleString() : '∞'}
                    </span>
                    <span className="text-sm font-bold">{Math.round((bracket.rate || 0) * 100)}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Additional Dollar Impact */}
          {calculation.content?.additional_dollar_impact && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  💡 Auswirkung von 1€ zusätzlich
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(calculation.content.additional_dollar_impact).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Planning Opportunities */}
          {(calculation.content?.planning_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Planungsmöglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {calculation.content.planning_opportunities.map((opp, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihre Daten aus und klicken Sie "Berechnen"
        </div>
      )}
    </div>
  );
}