import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CURRENT_YEAR = new Date().getFullYear();

export default function DACHTaxComparison() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [selectedCountries, setSelectedCountries] = useState(['DE', 'AT', 'CH']);

  const { data: deTaxes } = useQuery({
    queryKey: ['calculatedTaxDE', taxYear],
    queryFn: () => base44.functions.invoke('calculateTaxAT', { taxYear }).then(r => r.data),
    enabled: selectedCountries.includes('DE')
  });

  const { data: atTaxes } = useQuery({
    queryKey: ['calculatedTaxAT', taxYear],
    queryFn: () => base44.functions.invoke('calculateTaxAT', { taxYear }).then(r => r.data),
    enabled: selectedCountries.includes('AT')
  });

  const { data: chTaxes } = useQuery({
    queryKey: ['calculatedTaxCH', taxYear],
    queryFn: () => base44.functions.invoke('calculateTaxCH', { taxYear, canton: 'ZH' }).then(r => r.data),
    enabled: selectedCountries.includes('CH')
  });

  const comparisonData = [
    {
      category: 'Österreich',
      taxDue: atTaxes?.taxes?.taxDue || 0,
      income: atTaxes?.summary?.totalTaxableIncome || 0,
      effectiveRate: atTaxes ? ((atTaxes.taxes.taxDue / atTaxes.summary.totalTaxableIncome) * 100).toFixed(2) : 0
    },
    {
      category: 'Schweiz (ZH)',
      taxDue: chTaxes?.taxes?.totalTaxDue || 0,
      income: chTaxes?.summary?.totalIncome || 0,
      effectiveRate: chTaxes ? ((chTaxes.taxes.totalTaxDue / (chTaxes.summary?.totalIncome || 1)) * 100).toFixed(2) : 0
    }
  ].filter(item => selectedCountries.includes(item.category.split(' ')[0]) || selectedCountries.includes('CH'));

  const taxRateComparison = [
    { name: 'Österreich', rate: 30, deductions: 20 },
    { name: 'Schweiz', rate: 25, deductions: 15 }
  ];

  const COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🌍 DACH Steuervergleich</h1>
          <p className="text-slate-500 mt-1">Vergleichen Sie Steuersätze und Belastungen</p>
        </div>
        <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">🇦🇹 Österreich</p>
            <p className="text-3xl font-bold mt-2">€{(atTaxes?.taxes?.taxDue || 0).toLocaleString('de-AT')}</p>
            <p className="text-xs text-slate-500 mt-1">
              Effektiver Satz: {atTaxes ? ((atTaxes.taxes.taxDue / atTaxes.summary.totalTaxableIncome) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">🇨🇭 Schweiz</p>
            <p className="text-3xl font-bold mt-2">CHF {(chTaxes?.taxes?.totalTaxDue || 0).toLocaleString('de-CH')}</p>
            <p className="text-xs text-slate-500 mt-1">
              Effektiver Satz: {chTaxes ? ((chTaxes.taxes.totalTaxDue / (chTaxes.summary?.totalIncome || 1)) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">💡 Differenz</p>
            <p className="text-3xl font-bold mt-2">
              {atTaxes && chTaxes ? (((atTaxes.taxes.taxDue - chTaxes.taxes.totalTaxDue) / atTaxes.taxes.taxDue * 100).toFixed(1)) : '—'}%
            </p>
            <p className="text-xs text-slate-500 mt-1">AT vs. CH Steuerbelastung</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Rate Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Steuer- und Abzugsvergleich</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taxRateComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rate" fill="#ef4444" name="Steuer %" />
              <Bar dataKey="deductions" fill="#3b82f6" name="Abzüge %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Austria Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>🇦🇹 Österreich Detailbreakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-sm">Einkommen (Brutto)</span>
              <Badge variant="outline">€{(atTaxes?.summary?.totalTaxableIncome || 0).toLocaleString('de-AT')}</Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-sm">- KESt</span>
              <Badge className="bg-red-100 text-red-800">€{(atTaxes?.taxes?.kestWithheld || 0).toLocaleString('de-AT')}</Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-sm">- Kirchensteuer</span>
              <Badge className="bg-red-100 text-red-800">€{(atTaxes?.taxes?.churchTaxWithheld || 0).toLocaleString('de-AT')}</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded border-t-2 font-bold">
              <span>Steuerschuld</span>
              <Badge className="bg-green-600 text-white">€{(atTaxes?.taxes?.taxDue || 0).toLocaleString('de-AT')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Switzerland Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>🇨🇭 Schweiz (ZH) Detailbreakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-sm">Gesamteinkommen</span>
              <Badge variant="outline">CHF {(chTaxes?.summary?.totalIncome || 0).toLocaleString('de-CH')}</Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-sm">- Bundessteuer</span>
              <Badge className="bg-red-100 text-red-800">CHF {(chTaxes?.taxes?.federalIncomeTax || 0).toLocaleString('de-CH')}</Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-sm">- Kantonalsteuer</span>
              <Badge className="bg-red-100 text-red-800">CHF {(chTaxes?.taxes?.cantonalIncomeTax || 0).toLocaleString('de-CH')}</Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-sm">- Vermögenssteuer</span>
              <Badge className="bg-red-100 text-red-800">CHF {(chTaxes?.taxes?.wealthTax || 0).toLocaleString('de-CH')}</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded border-t-2 font-bold">
              <span>Gesamtsteuerschuld</span>
              <Badge className="bg-green-600 text-white">CHF {(chTaxes?.taxes?.totalTaxDue || 0).toLocaleString('de-CH')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-blue-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle>💡 Empfehlungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="p-3 bg-white rounded border-l-4 border-blue-500">
            <p className="font-semibold text-sm">🇦🇹 Österreich: Sparer-Freibetrag nutzen</p>
            <p className="text-xs text-slate-600 mt-1">Bis zu €730 pro Person können steuerbefreit verzinst werden.</p>
          </div>
          <div className="p-3 bg-white rounded border-l-4 border-green-500">
            <p className="font-semibold text-sm">🇨🇭 Schweiz: Hypothekarzinsen abziehen</p>
            <p className="text-xs text-slate-600 mt-1">Vollständiger Abzug der Hypothekarzinsen möglich je nach Kanton.</p>
          </div>
          <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
            <p className="font-semibold text-sm">🌍 DACH-Überblick: Standortwahl optimieren</p>
            <p className="text-xs text-slate-600 mt-1">Unterschiedliche Steuersätze können bei Umzügen berücksichtigt werden.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}