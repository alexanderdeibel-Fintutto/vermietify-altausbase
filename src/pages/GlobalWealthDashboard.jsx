import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Globe, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const SWISS_CANTONS = { ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', AG: 'Aargau', SG: 'Sankt Gallen' };

export default function GlobalWealthDashboard() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [selectedCanton, setSelectedCanton] = useState('ZH');

  // Germany
  const { data: investmentsDE = [] } = useQuery({
    queryKey: ['investmentsDE', taxYear],
    queryFn: () => base44.entities.Investment.filter({ tax_year: taxYear }) || []
  });

  // Austria
  const { data: investmentsAT = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  // Switzerland
  const { data: investmentsCH = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear, selectedCanton],
    queryFn: () => base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton: selectedCanton }) || [],
    enabled: !!selectedCanton
  });

  const { data: realEstateCH = [] } = useQuery({
    queryKey: ['realEstateCH', taxYear, selectedCanton],
    queryFn: () => base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton: selectedCanton }) || [],
    enabled: !!selectedCanton
  });

  // Calculate totals
  const deTotal = investmentsDE.reduce((sum, inv) => sum + (inv.quantity * inv.current_value || 0), 0);
  const atTotal = investmentsAT.reduce((sum, inv) => sum + inv.gross_income, 0);
  const chInvTotal = investmentsCH.reduce((sum, inv) => sum + (inv.quantity * inv.current_value || 0), 0);
  const chRealTotal = realEstateCH.reduce((sum, re) => sum + re.current_market_value, 0);
  const chTotal = chInvTotal + chRealTotal;

  // Currency conversion (simplified - real app would use live rates)
  const EUR_CHF = 0.95; // EUR to CHF
  const EXCHANGE_RATES = {
    EUR: 1,
    CHF: EUR_CHF
  };

  // Standardize to EUR
  const deTotalEUR = deTotal;
  const atTotalEUR = atTotal;
  const chTotalEUR = chTotal / EXCHANGE_RATES.CHF;

  const totalWealth = deTotalEUR + atTotalEUR + chTotalEUR;

  const countryDistribution = [
    { name: 'Deutschland', value: deTotalEUR, percent: (deTotalEUR / totalWealth * 100).toFixed(1), color: '#3b82f6' },
    { name: 'Österreich', value: atTotalEUR, percent: (atTotalEUR / totalWealth * 100).toFixed(1), color: '#ef4444' },
    { name: 'Schweiz', value: chTotalEUR, percent: (chTotalEUR / totalWealth * 100).toFixed(1), color: '#10b981' }
  ];

  const assetTypes = [
    { name: 'Investments', DE: investmentsDE.length, AT: investmentsAT.length, CH: investmentsCH.length },
    { name: 'Immobilien', DE: 0, AT: 0, CH: realEstateCH.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="w-8 h-8" /> Globales Vermögens-Dashboard
        </h1>
        <div className="w-40">
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
            <SelectTrigger>
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

      {/* Canton Selector */}
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

      {/* Total Wealth */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Gesamtvermögen (EUR-equivalent)</p>
              <p className="text-4xl font-bold">€ {(totalWealth / 1000).toFixed(0)}K</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-30" />
          </div>
        </CardContent>
      </Card>

      {/* Country Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🌍 Länderverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={countryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {countryDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `€${(value / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {countryDistribution.map(country => (
                <div key={country.name} className="flex justify-between text-sm">
                  <span>{country.name}</span>
                  <span className="font-bold">€{(country.value / 1000).toFixed(0)}K ({country.percent}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Assets pro Land</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={assetTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="DE" fill="#3b82f6" />
                <Bar dataKey="AT" fill="#ef4444" />
                <Bar dataKey="CH" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Country Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🇩🇪 Deutschland</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-600">Vermögen</p>
              <p className="text-2xl font-bold">€{(deTotalEUR / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Positionen</p>
              <p className="text-lg font-bold">{investmentsDE.length}</p>
            </div>
            <Button size="sm" variant="outline" className="w-full">Details</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🇦🇹 Österreich</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-600">Vermögen</p>
              <p className="text-2xl font-bold">€{(atTotalEUR / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Positionen</p>
              <p className="text-lg font-bold">{investmentsAT.length}</p>
            </div>
            <Button size="sm" variant="outline" className="w-full">Details</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🇨🇭 Schweiz ({SWISS_CANTONS[selectedCanton]})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-600">Vermögen</p>
              <p className="text-2xl font-bold">CHF {(chTotal / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Positionen</p>
              <p className="text-lg font-bold">{investmentsCH.length + realEstateCH.length}</p>
            </div>
            <Button size="sm" variant="outline" className="w-full">Details</Button>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <div className="flex gap-2">
        <Button className="gap-2" onClick={() => toast.success('Report wird generiert...')}>
          <Briefcase className="w-4 h-4" /> Report generieren
        </Button>
      </div>
    </div>
  );
}