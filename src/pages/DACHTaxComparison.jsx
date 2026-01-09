import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CURRENT_YEAR = new Date().getFullYear();
const SWISS_CANTONS = { ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', AG: 'Aargau', SG: 'Sankt Gallen' };

export default function DACHTaxComparison() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [selectedCanton, setSelectedCanton] = useState('ZH');

  // Germany Data
  const { data: investmentsDE = [] } = useQuery({
    queryKey: ['investmentsDE', taxYear],
    queryFn: () => base44.entities.Investment.filter({ tax_year: taxYear }) || []
  });

  // Austria Data
  const { data: investmentsAT = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  // Switzerland Data
  const { data: investmentsCH = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear, selectedCanton],
    queryFn: () => base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton: selectedCanton }) || []
  });

  // Calculate totals
  const totalDE = investmentsDE.reduce((sum, inv) => sum + inv.gross_income, 0);
  const totalAT = investmentsAT.reduce((sum, inv) => sum + inv.gross_income, 0);
  const totalCH = investmentsCH.reduce((sum, inv) => sum + (inv.dividend_income || 0), 0);

  // Tax calculations (simplified)
  const taxDE = totalDE > 801 ? (totalDE - 801) * 0.26375 : 0; // Abgeltungssteuer
  const taxAT = totalAT > 0 ? totalAT * 0.275 : 0; // KESt
  const taxCH = totalCH > 0 ? totalCH * 0.15 : 0; // Estimated avg

  const comparisonData = [
    {
      country: 'Deutschland',
      income: totalDE,
      tax: taxDE,
      effective: totalDE > 0 ? (taxDE / totalDE * 100).toFixed(2) : 0
    },
    {
      country: 'Österreich',
      income: totalAT,
      tax: taxAT,
      effective: totalAT > 0 ? (taxAT / totalAT * 100).toFixed(2) : 0
    },
    {
      country: 'Schweiz',
      income: totalCH,
      tax: taxCH,
      effective: totalCH > 0 ? (taxCH / totalCH * 100).toFixed(2) : 0
    }
  ];

  const chartData = [
    {
      name: 'Deutschland',
      Einkommen: totalDE,
      Steuern: taxDE
    },
    {
      name: 'Österreich',
      Einkommen: totalAT,
      Steuern: taxAT
    },
    {
      name: 'Schweiz',
      Einkommen: totalCH,
      Steuern: taxCH
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🌍 DACH-Vergleich {taxYear}</h1>
        <div className="flex items-center gap-2">
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Canton Selector for CH */}
      <Card>
        <CardContent className="pt-6">
          <div className="w-40">
            <Select value={selectedCanton} onValueChange={setSelectedCanton}>
              <SelectTrigger>
                <SelectValue placeholder="Kanton..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SWISS_CANTONS).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Kapitalerträge & Steuerlast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Land</th>
                  <th className="text-right py-2">Einkommen</th>
                  <th className="text-right py-2">Steuerlast</th>
                  <th className="text-right py-2">Effektivsatz</th>
                  <th className="text-right py-2">Nettoeinkommen</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.country} className="border-b hover:bg-slate-50">
                    <td className="py-3 font-medium">{row.country}</td>
                    <td className="text-right">{row.country === 'Schweiz' ? 'CHF' : '€'} {row.income.toFixed(0)}</td>
                    <td className="text-right text-red-600 font-bold">{row.country === 'Schweiz' ? 'CHF' : '€'} {row.tax.toFixed(0)}</td>
                    <td className="text-right">{row.effective}%</td>
                    <td className="text-right font-bold text-green-600">{row.country === 'Schweiz' ? 'CHF' : '€'} {(row.income - row.tax).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Visuelle Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Einkommen" fill="#3b82f6" />
              <Bar dataKey="Steuern" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Country Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={createPageUrl('TaxDashboard')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl">🇩🇪 Deutschland</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-slate-600">Einkommen</p>
                <p className="text-lg font-bold">€ {totalDE.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Abgeltungssteuer</p>
                <p className="text-lg font-bold text-red-600">€ {taxDE.toFixed(0)}</p>
              </div>
              <Badge>{investmentsDE.length} Assets</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('TaxDashboardAT')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl">🇦🇹 Österreich</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-slate-600">Einkommen</p>
                <p className="text-lg font-bold">€ {totalAT.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">KESt 27.5%</p>
                <p className="text-lg font-bold text-red-600">€ {taxAT.toFixed(0)}</p>
              </div>
              <Badge>{investmentsAT.length} Assets</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('TaxDashboardCH')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl">🇨🇭 Schweiz ({SWISS_CANTONS[selectedCanton]})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-slate-600">Dividenden</p>
                <p className="text-lg font-bold">CHF {totalCH.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Geschätzte Steuer</p>
                <p className="text-lg font-bold text-red-600">CHF {taxCH.toFixed(0)}</p>
              </div>
              <Badge>{investmentsCH.length} Assets</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tax Rules Summary */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle>📋 Steuersysteme im Überblick</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-bold mb-2">🇩🇪 Deutschland</h4>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>• Abgeltungssteuer: 26,375%</li>
                <li>• Sparerpauschbetrag: €801</li>
                <li>• Kirchensteuer möglich</li>
                <li>• Fond: ELSTER-XML Export</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">🇦🇹 Österreich</h4>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>• KESt: 27,5%</li>
                <li>• Sparerfreibetrag: €730</li>
                <li>• Kirchensteuer: 3-4%</li>
                <li>• Privatvermögen: Steuerfrei</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">🇨🇭 Schweiz</h4>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>• Verrechnungssteuer: 35%</li>
                <li>• Kantonal: 5-22%</li>
                <li>• Vermögenssteuer: Kantonal</li>
                <li>• Hypothekarzins: Abzugsfähig</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}