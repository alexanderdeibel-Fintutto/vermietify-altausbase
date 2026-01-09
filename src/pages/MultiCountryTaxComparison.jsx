import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const CURRENT_YEAR = new Date().getFullYear();

export default function MultiCountryTaxComparison() {
  const [taxYear] = useState(CURRENT_YEAR - 1);

  const { data: summaryReport = {} } = useQuery({
    queryKey: ['taxSummaryReport', taxYear],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('generateTaxSummaryReport', {
        taxYear,
        countries: ['AT', 'CH', 'DE']
      });
      return data;
    }
  });

  const summary = summaryReport.summary || {};
  const globalSummary = summaryReport.global_summary || {};

  // Prepare chart data
  const comparisonData = [
    {
      country: 'Österreich',
      income: summary.AT?.total_income || 0,
      tax: 0,
      effective_rate: 0
    },
    {
      country: 'Schweiz',
      income: summary.CH?.total_income || 0,
      tax: 0,
      effective_rate: 0
    },
    {
      country: 'Deutschland',
      income: summary.DE?.total_income || 0,
      tax: 0,
      effective_rate: 0
    }
  ];

  const featureComparison = [
    {
      feature: 'Kapitalertrag Tax',
      AT: 'KESt 27,5%',
      CH: 'Kanton 15-22%',
      DE: 'Abgeltungssteuer 26,375%'
    },
    {
      feature: 'Freibetrag',
      AT: '€730 Sparerfreibetrag',
      CH: 'Keiner',
      DE: '€801 Sparerpauschbetrag'
    },
    {
      feature: 'Vermögenssteuer',
      AT: 'Ja (0,5%)',
      CH: 'Ja (Kanton)',
      DE: 'Nein'
    },
    {
      feature: 'Kirchensteuer',
      AT: 'Ja (bis 9%)',
      CH: 'Nein',
      DE: 'Ja (8-9%)'
    },
    {
      feature: 'Hypothekarzinsen',
      AT: 'Begrenzt',
      CH: 'Vollständig abzugsf.',
      DE: 'Nicht abzugsf.'
    }
  ];

  const taxRateComparison = [
    {
      category: 'Kapitalertrag',
      AT: summary.AT?.capital_income ? 27.5 : 0,
      CH: summary.CH?.dividend_income ? 15 : 0,
      DE: summary.DE?.capital_income ? 26.375 : 0
    },
    {
      category: 'Mieteinnahmen',
      AT: 42,
      CH: summary.CH?.rental_income ? 20 : 0,
      DE: 42
    },
    {
      category: 'Vermögen',
      AT: 0.5,
      CH: 3,
      DE: 0
    }
  ];

  const statusBadge = (value) => {
    if (!value) return <Badge className="bg-slate-100 text-slate-800">N/A</Badge>;
    return <Badge className="bg-green-100 text-green-800">✓</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 DACH Steuervergleich</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie Ihre Steuersituation in Österreich, Schweiz & Deutschland</p>
      </div>

      {/* Global Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Länder</p>
            <p className="text-3xl font-bold">{globalSummary.countries?.length || 3}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Gesamteinkommen</p>
            <p className="text-2xl font-bold">€{(globalSummary.total_income / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Einträge gesamt</p>
            <p className="text-3xl font-bold">{globalSummary.total_entries || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Steuerjahr</p>
            <p className="text-3xl font-bold">{taxYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Einkommen nach Land */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Gesamteinkommen nach Land</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                <Bar dataKey="income" fill="#3b82f6" name="Einkommen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Steuersätze Radar */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Effektive Steuersätze</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={taxRateComparison}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 50]} />
                <Radar name="Österreich" dataKey="AT" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                <Radar name="Schweiz" dataKey="CH" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Radar name="Deutschland" dataKey="DE" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detaillierte Vergleichstabelle */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Detaillierter Steuervergleich</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold">Steuerform</th>
                  <th className="text-center p-3 font-semibold">🇦🇹 Österreich</th>
                  <th className="text-center p-3 font-semibold">🇨🇭 Schweiz</th>
                  <th className="text-center p-3 font-semibold">🇩🇪 Deutschland</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-700">{row.feature}</td>
                    <td className="p-3 text-center">{row.AT}</td>
                    <td className="p-3 text-center">{row.CH}</td>
                    <td className="p-3 text-center">{row.DE}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Country Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Austria */}
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🇦🇹</span> Österreich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-600">Gesamteinkommen</p>
              <p className="font-semibold">€{(summary.AT?.total_income || 0).toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Einträge</p>
              <p className="font-semibold">{Object.values(summary.AT?.entries || {}).reduce((a, b) => a + b, 0)}</p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs font-semibold mb-2">Besonderheiten:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ KESt 27,5% auf Kapitalerträge</li>
                <li>✓ Sparerfreibetrag €730</li>
                <li>✓ Anlage KAP erforderlich</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Switzerland */}
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🇨🇭</span> Schweiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-600">Gesamteinkommen</p>
              <p className="font-semibold">CHF {(summary.CH?.total_income || 0).toLocaleString('de-CH')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Einträge</p>
              <p className="font-semibold">{Object.values(summary.CH?.entries || {}).reduce((a, b) => a + b, 0)}</p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs font-semibold mb-2">Besonderheiten:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ Kanton-Steuersätze 15-22%</li>
                <li>✓ Hypothekarzinsen 100% abzugsfähig</li>
                <li>✓ Vermögenssteuer pro Kanton</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Germany */}
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🇩🇪</span> Deutschland
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-600">Gesamteinkommen</p>
              <p className="font-semibold">€{(summary.DE?.total_income || 0).toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Einträge</p>
              <p className="font-semibold">{Object.values(summary.DE?.entries || {}).reduce((a, b) => a + b, 0)}</p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs font-semibold mb-2">Besonderheiten:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ Abgeltungssteuer 26,375%</li>
                <li>✓ Sparerpauschbetrag €801</li>
                <li>✓ Kirchensteuer 8-9%</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      <Card className="bg-blue-50 border-blue-300">
        <CardHeader>
          <CardTitle>💡 Empfehlungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>Österreich:</strong> Nutzen Sie den Sparerfreibetrag von €730 durch Übertragung auf Partner</p>
          <p>• <strong>Schweiz:</strong> Maximieren Sie Hypothekarzinsenabzüge bei Immobilienbesitz</p>
          <p>• <strong>Deutschland:</strong> Verteilen Sie Gewinne auf mehrere Jahre zur Progression-Reduktion</p>
        </CardContent>
      </Card>
    </div>
  );
}