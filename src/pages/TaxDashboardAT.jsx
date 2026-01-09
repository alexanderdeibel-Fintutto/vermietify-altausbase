import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDashboardAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  const { data: otherIncomes = [] } = useQuery({
    queryKey: ['otherIncomesAT', taxYear],
    queryFn: () => base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || []
  });

  const forms = [
    {
      id: 'e1kv',
      title: 'E1kv',
      description: 'Kapitalvermögen',
      page: 'AnlageKAPAT',
      count: investments.length,
      icon: '📊'
    },
    {
      id: 'sonstige',
      title: 'Sonstige',
      description: 'Sonstige Einkünfte',
      page: 'AnlageSOAT',
      count: otherIncomes.length,
      icon: '📋'
    }
  ];

  const totalKapital = investments.reduce((sum, inv) => sum + inv.gross_income, 0);
  const totalOther = otherIncomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🇦🇹 Österreich Steuerjahr {taxYear}</h1>
        <p className="text-slate-500 mt-1">Finanzamt Steuererklärung</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forms.map(form => (
          <Link key={form.id} to={createPageUrl(form.page)}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {form.icon} {form.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-3">{form.description}</p>
                {form.count > 0 ? (
                  <Badge className="bg-green-100 text-green-800">✅ {form.count} Einträge</Badge>
                ) : (
                  <Badge variant="secondary">❌ Fehlt</Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle>📊 Zusammenfassung {taxYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Kapitalerträge</p>
              <p className="text-2xl font-bold">€{totalKapital.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Sonstige Einkünfte</p>
              <p className="text-2xl font-bold">€{totalOther.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Formulare</p>
              <p className="text-2xl font-bold">{forms.filter(f => f.count > 0).length}/{forms.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="gap-2">💾 Exportieren</Button>
        <Button variant="outline" className="gap-2">✅ Validieren</Button>
      </div>
    </div>
  );
}