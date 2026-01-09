import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Globe, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function InternationalTaxStrategy() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: strategy = {}, isLoading } = useQuery({
    queryKey: ['internationalTaxStrategy', taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateInternationalTaxStrategy', {
        taxYear
      });
      return response.data?.strategy || {};
    }
  });

  const taxComparison = [
    { country: 'Austria', tax: strategy.current_status?.austria?.total_tax || 0 },
    { country: 'Switzerland', tax: strategy.current_status?.switzerland?.total_tax || 0 },
    { country: 'Germany', tax: strategy.current_status?.germany?.total_tax || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 International Tax Strategy</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Steuerlast über alle DACH-Länder</p>
      </div>

      {/* Controls */}
      <div className="flex-1 max-w-xs">
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

      {isLoading ? (
        <div className="text-center py-8">⏳ Generiere internationale Steuerstrategie...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Globe className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Gesamtsteuerlast</p>
                <p className="text-2xl font-bold mt-2">
                  €{Math.round(strategy.current_status?.combined_tax || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Effektiver Steuersatz</p>
                <p className="text-2xl font-bold mt-2">{Math.round(strategy.strategy?.effective_tax_rate || 0)}%</p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <TrendingDown className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Geschätzte Einsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(strategy.strategy?.estimated_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Länder</p>
                <p className="text-2xl font-bold mt-2">3</p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">💰 Steuerlast nach Land</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taxComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                  <Bar dataKey="tax" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Double Taxation Risks */}
          {(strategy.strategy?.double_taxation_risks || []).length > 0 && (
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900 text-sm">
                <strong>Doppelbesteuerungs-Risiken:</strong>
                <ul className="mt-2 space-y-1 ml-4">
                  {strategy.strategy.double_taxation_risks.map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Treaty Benefits */}
          {(strategy.strategy?.treaty_benefits || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✅ Abkommens-Vorteile</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.strategy.treaty_benefits.map((benefit, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-green-600">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Country-Specific Strategies */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(strategy.strategy?.country_strategies || {}).map(([country, data]) => (
              <Card key={country}>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {country === 'austria' && '🇦🇹 Österreich'}
                    {country === 'switzerland' && '🇨🇭 Schweiz'}
                    {country === 'germany' && '🇩🇪 Deutschland'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {Object.entries(data || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-slate-600">{key}:</span>
                      <span className="font-medium">{String(value).substring(0, 50)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cross-Border Opportunities */}
          {(strategy.strategy?.cross_border_opportunities || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">🌉 Grenzüberschreitende Möglichkeiten</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.strategy.cross_border_opportunities.map((opp, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Badge className="flex-shrink-0 bg-blue-200 text-blue-800 text-xs mt-0.5">
                        {i + 1}
                      </Badge>
                      {opp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Priority Actions */}
          {(strategy.strategy?.priority_actions || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">🎯 Prioritäre Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {strategy.strategy.priority_actions.map((action, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Badge className="flex-shrink-0 bg-orange-200 text-orange-800 text-xs mt-0.5">
                        {i + 1}
                      </Badge>
                      {action}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Implementation Timeline */}
          {strategy.strategy?.implementation_timeline && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Umsetzungs-Timeline</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                {strategy.strategy.implementation_timeline}
              </CardContent>
            </Card>
          )}

          {/* Risk Summary */}
          {strategy.strategy?.risk_summary && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900 text-sm">
                <strong>Risiko-Zusammenfassung:</strong> {strategy.strategy.risk_summary}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}