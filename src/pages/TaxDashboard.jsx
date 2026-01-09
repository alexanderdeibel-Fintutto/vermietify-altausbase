import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FileText, CheckCircle2, AlertCircle, Plus, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDashboard() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: forms = [] } = useQuery({
    queryKey: ['taxForms', taxYear],
    queryFn: async () => {
      return await base44.entities.TaxForm.filter({
        tax_year: taxYear
      }, '-updated_date', 100) || [];
    }
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', taxYear],
    queryFn: () => base44.entities.Investment.filter({ tax_year: taxYear }) || []
  });

  const { data: otherIncomes = [] } = useQuery({
    queryKey: ['otherIncomes', taxYear],
    queryFn: () => base44.entities.OtherIncome.filter({ tax_year: taxYear }) || []
  });

  const { data: capitalGains = [] } = useQuery({
    queryKey: ['capitalGains', taxYear],
    queryFn: () => base44.entities.CapitalGain.filter({ tax_year: taxYear }) || []
  });

  // Calculate summaries
  const investmentIncome = investments.reduce((sum, inv) => sum + inv.gross_income, 0);
  const otherIncome = otherIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const capitalGainTotal = capitalGains.reduce((sum, gain) => sum + gain.gain_loss, 0);

  const forms_config = [
    {
      id: 'anlage_v',
      title: 'Anlage V',
      subtitle: 'Einkünfte aus Vermietung und Verpachtung',
      path: '/steuern/anlage-v',
      status: forms.find(f => f.form_type === 'ANLAGE_V')?.status || 'missing',
      count: 0
    },
    {
      id: 'anlage_kap',
      title: 'Anlage KAP',
      subtitle: 'Einkünfte aus Kapitalvermögen',
      path: '/steuern/anlage-kap',
      status: investments.length > 0 ? 'created' : 'missing',
      count: investments.length
    },
    {
      id: 'anlage_so',
      title: 'Anlage SO',
      subtitle: 'Sonstige Einkünfte',
      path: '/steuern/anlage-so',
      status: otherIncomes.length > 0 ? 'created' : 'missing',
      count: otherIncomes.length
    },
    {
      id: 'anlage_vg',
      title: 'Anlage VG',
      subtitle: 'Veräußerungsgeschäfte',
      path: '/steuern/anlage-vg',
      status: capitalGains.length > 0 ? 'created' : 'missing',
      count: capitalGains.length
    }
  ];

  const getStatusBadge = (status, count) => {
    if (count === 0) {
      return <Badge variant="secondary">❌ Fehlt</Badge>;
    }
    if (status === 'created') {
      return <Badge className="bg-green-100 text-green-800">✅ Erstellt ({count})</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Unvollständig</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧾 Steuer-Dashboard</h1>
          <p className="text-slate-500 mt-1">Steuerjahr {taxYear}</p>
        </div>
        <div className="w-32">
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

      {/* Anlagen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {forms_config.map(form => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{form.subtitle}</p>
                </div>
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>{getStatusBadge(form.status, form.count)}</div>
              <Link to={createPageUrl(form.path.split('/')[2].charAt(0).toUpperCase() + form.path.split('/')[2].slice(1).replace('-', ''))}>
                <Button variant="outline" className="w-full text-xs h-8">
                  {form.count > 0 ? 'Bearbeiten' : 'Erstellen'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Steuerliche Übersicht */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle>📊 Steuerliche Übersicht {taxYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded border">
              <p className="text-sm text-slate-600">Kapitalerträge</p>
              <p className="text-2xl font-bold mt-2">{investmentIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              <p className="text-xs text-slate-500 mt-1">{investments.length} Position(en)</p>
            </div>

            <div className="p-4 bg-white rounded border">
              <p className="text-sm text-slate-600">Sonstige Einkünfte</p>
              <p className="text-2xl font-bold mt-2">{otherIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              <p className="text-xs text-slate-500 mt-1">{otherIncomes.length} Einnahme(n)</p>
            </div>

            <div className="p-4 bg-white rounded border">
              <p className="text-sm text-slate-600">Veräußerungsgewinne</p>
              <p className={`text-2xl font-bold mt-2 ${capitalGainTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {capitalGainTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-slate-500 mt-1">{capitalGains.length} Geschäft(e)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkliste */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Checkliste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {forms_config.map(form => (
              <div key={form.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                {form.count > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-slate-400" />
                )}
                <span className="flex-1 text-sm">{form.title}</span>
                {form.count > 0 && (
                  <span className="text-xs text-slate-500">{form.count} Einträge</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}