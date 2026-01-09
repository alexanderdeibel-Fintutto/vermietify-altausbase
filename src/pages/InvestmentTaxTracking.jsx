import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function InvestmentTaxTracking() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [track, setTrack] = useState(false);

  const { data: tracking = {}, isLoading } = useQuery({
    queryKey: ['investmentTax', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('trackInvestmentTax', {
        country,
        taxYear
      });
      return response.data?.tracking || {};
    },
    enabled: track
  });

  const analysis = tracking.analysis || {};
  
  const incomeData = [
    { name: 'Dividenden', value: Math.round(analysis.dividend_income || 0) },
    { name: 'Langfristige Gewinne', value: Math.round(analysis.capital_gains_long_term || 0) },
    { name: 'Kurzfristige Gewinne', value: Math.round(analysis.capital_gains_short_term || 0) }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📈 Investment Tax Tracking</h1>
        <p className="text-slate-500 mt-1">Verfolgen und optimieren Sie Anlagebesteuerung</p>
      </div>

      {/* Controls */}
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
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => setTrack(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Analyse Starten
          </Button>
        </div>
      </div>

      {isLoading && track && (
        <div className="text-center py-8">⏳ Tracking wird durchgeführt...</div>
      )}

      {track && tracking.analysis && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-600">Steuerpflichtiges Einkommen</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      €{Math.round(analysis.total_taxable_income || 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-600">Geschätzte Steuerbelastung</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      €{Math.round(analysis.tax_liability || 0).toLocaleString()}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Income Breakdown */}
          {incomeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Einkommens-Zusammensetzung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: €${value.toLocaleString()}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Income Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysis.dividend_income > 0 && (
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Dividendeneinkommen</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    €{Math.round(analysis.dividend_income).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
            {analysis.capital_gains_long_term > 0 && (
              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Langfristige Gewinne</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    €{Math.round(analysis.capital_gains_long_term).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
            {analysis.available_losses > 0 && (
              <Card className="border-orange-300 bg-orange-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Verfügbare Verluste</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    €{Math.round(analysis.available_losses).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Documentation Status */}
          {analysis.documentation_status && Object.keys(analysis.documentation_status).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Dokumentations-Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(analysis.documentation_status).map(([doc, status]) => (
                  <div key={doc} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-sm">{doc}</span>
                    <Badge className={status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {status === 'complete' ? '✓ Vollständig' : '⚠️ ' + (status || 'Ausstehend')}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(analysis.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Optimierungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-blue-50 rounded text-sm">
                    <span className="text-blue-600 font-bold">→</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optimization Potential */}
          {analysis.optimization_potential > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Optimierungs-Potenzial</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(analysis.optimization_potential).toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 mt-2">Mögliche Einsparungen durch Optimierung</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}