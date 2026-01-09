import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function InvestmentTaxTracking() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [tracking, setTracking] = useState(false);

  const { data: analysis = {}, isLoading } = useQuery({
    queryKey: ['investmentTax', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('trackInvestmentTax', {
        country,
        taxYear
      });
      return response.data?.analysis || {};
    },
    enabled: tracking
  });

  const pieData = [
    { name: 'Kapitalgewinne', value: Math.abs(analysis.taxable_gains || 0) },
    { name: 'Dividenden', value: analysis.dividend_income || 0 },
    { name: 'Zinsen', value: analysis.interest_income || 0 }
  ].filter(item => item.value > 0);

  const COLORS = ['#ef4444', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📈 Anlagen-Steuer Tracking</h1>
        <p className="text-slate-500 mt-1">Überwachen Sie Ihre Anlagensteuern</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={tracking}>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={tracking}>
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
        <div className="flex items-end">
          <Button
            onClick={() => setTracking(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={tracking}
          >
            Analysieren
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : tracking && Object.keys(analysis).length > 0 ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Steuerpflichtiger Gewinne</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(analysis.taxable_gains || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Verfügbare Verluste</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(analysis.available_losses || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Geschätzte Steuerpflicht</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(analysis.tax_liability || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income Breakdown */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Einkommensaufschlüsselung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: €${Math.round(value).toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Income Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">💰 Einkommensdetails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-l-4 border-red-300 pl-3">
                <p className="text-sm text-slate-600">Kapitalgewinne</p>
                <p className="text-lg font-bold text-red-600">€{Math.round(analysis.taxable_gains || 0).toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-blue-300 pl-3">
                <p className="text-sm text-slate-600">Dividendeneinkommen</p>
                <p className="text-lg font-bold text-blue-600">€{Math.round(analysis.dividend_income || 0).toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-green-300 pl-3">
                <p className="text-sm text-slate-600">Zinseinkommen</p>
                <p className="text-lg font-bold text-green-600">€{Math.round(analysis.interest_income || 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities */}
          {(analysis.optimization_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  💡 Optimierungsmöglichkeiten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.optimization_opportunities.map((opp, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Wash Sale Warnings */}
          {(analysis.wash_sale_warnings || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ⚠️ Wash-Sale Warnungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.wash_sale_warnings.map((warning, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    {warning}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(analysis.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Analysieren", um Ihre Anlagensteuern zu überwachen
        </div>
      )}
    </div>
  );
}