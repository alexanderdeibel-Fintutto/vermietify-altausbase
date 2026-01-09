import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function GlobalTaxOverview() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  // Austria data
  const { data: investmentsAT = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  const { data: otherIncomesAT = [] } = useQuery({
    queryKey: ['otherIncomesAT', taxYear],
    queryFn: () => base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || []
  });

  // Switzerland data (using canton ZH as default)
  const { data: investmentsCH = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear, 'ZH'],
    queryFn: () => base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton: 'ZH' }) || []
  });

  const { data: realEstateCH = [] } = useQuery({
    queryKey: ['realEstateCH', taxYear, 'ZH'],
    queryFn: () => base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton: 'ZH' }) || []
  });

  // Germany data
  const { data: investmentsDE = [] } = useQuery({
    queryKey: ['investmentsDE', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  const countries = [
    {
      code: 'AT',
      name: 'Österreich',
      flag: '🇦🇹',
      color: 'from-red-50 to-red-100',
      dashboardPath: 'TaxDashboardAT',
      dataPoints: [
        { label: 'Kapitalerträge', value: investmentsAT.length, icon: '💰' },
        { label: 'Sonstige Einkünfte', value: otherIncomesAT.length, icon: '📋' }
      ],
      totalIncome: investmentsAT.reduce((s, i) => s + (i.gross_income || 0), 0)
    },
    {
      code: 'CH',
      name: 'Schweiz',
      flag: '🇨🇭',
      color: 'from-green-50 to-green-100',
      dashboardPath: 'TaxDashboardCH',
      dataPoints: [
        { label: 'Wertschriften', value: investmentsCH.length, icon: '📊' },
        { label: 'Liegenschaften', value: realEstateCH.length, icon: '🏠' }
      ],
      totalIncome: investmentsCH.reduce((s, i) => s + (i.dividend_income || i.interest_income || 0), 0) +
                   realEstateCH.reduce((s, r) => s + (r.rental_income || 0), 0)
    },
    {
      code: 'DE',
      name: 'Deutschland',
      flag: '🇩🇪',
      color: 'from-yellow-50 to-yellow-100',
      dashboardPath: 'TaxDashboardDE',
      dataPoints: [
        { label: 'Kapitalerträge', value: investmentsDE.length, icon: '💰' },
        { label: 'Status', value: investmentsDE.length > 0 ? '✅' : '⏳', icon: '' }
      ],
      totalIncome: investmentsDE.reduce((s, i) => s + (i.gross_income || 0), 0)
    }
  ];

  const completionStatus = countries.map(c => ({
    code: c.code,
    dataCount: c.dataPoints.reduce((s, d) => s + (typeof d.value === 'number' ? d.value : 0), 0),
    color: c.code === 'AT' ? 'bg-red-100' : c.code === 'CH' ? 'bg-green-100' : 'bg-yellow-100'
  }));

  const globalTotalIncome = countries.reduce((s, c) => s + c.totalIncome, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Globe className="w-10 h-10" />
            DACH Steuer-Übersicht
          </h1>
          <p className="text-slate-500 mt-2">Steuerjahr {taxYear}</p>
        </div>
      </div>

      {/* Global Summary */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-white">
            <div>
              <p className="text-slate-300 text-sm mb-2">Gesamteinkommen (DACH)</p>
              <p className="text-4xl font-bold">€{globalTotalIncome.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-slate-300 text-sm mb-2">Länder erfasst</p>
              <p className="text-4xl font-bold">{completionStatus.filter(c => c.dataCount > 0).length}/3</p>
            </div>
            <div>
              <p className="text-slate-300 text-sm mb-2">Gesamtdatenpunkte</p>
              <p className="text-4xl font-bold">{completionStatus.reduce((s, c) => s + c.dataCount, 0)}</p>
            </div>
            <div>
              <p className="text-slate-300 text-sm mb-2">Status</p>
              <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-2 inline" />
                Aktiv
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Country Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {countries.map(country => (
          <Link key={country.code} to={createPageUrl(country.dashboardPath)}>
            <Card className={`hover:shadow-xl transition-shadow cursor-pointer h-full bg-gradient-to-br ${country.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{country.flag}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{country.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={country.code === 'AT' ? 'bg-red-200 text-red-800' : 
                                     country.code === 'CH' ? 'bg-green-200 text-green-800' : 
                                     'bg-yellow-200 text-yellow-800'}>
                      {country.code}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Einkommen</p>
                  <p className="text-2xl font-bold">€{country.totalIncome.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="space-y-2">
                  {country.dataPoints.map((point, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{point.label}</span>
                      <Badge variant="outline">{point.icon} {point.value}</Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="default">
                  Zum Dashboard →
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Erfassungsstand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completionStatus.map(c => {
              const country = countries.find(co => co.code === c.code);
              return (
                <div key={c.code}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{country?.name}</span>
                    <span className="text-sm text-slate-600">{c.dataCount} Einträge</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${c.color}`}
                      style={{ width: `${Math.min(100, (c.dataCount / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link to={createPageUrl('DACHTaxComparison')}>
              <Button className="w-full" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Ländervergleich
              </Button>
            </Link>
            <Link to={createPageUrl('TaxManagement')}>
              <Button className="w-full" variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Fristen & Abgaben
              </Button>
            </Link>
            <Link to={createPageUrl('DACHComplianceChecklist')}>
              <Button className="w-full" variant="outline">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Compliance-Check
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}