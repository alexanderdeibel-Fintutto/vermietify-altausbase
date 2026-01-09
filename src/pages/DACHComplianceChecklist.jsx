import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();

export default function DACHComplianceChecklist() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [checklist, setChecklist] = useState({
    de_investments: false,
    de_other_income: false,
    de_capital_gains: false,
    at_investments: false,
    at_other_income: false,
    ch_investments: false,
    ch_real_estate: false,
    documentation: false,
    validation: false
  });

  const { data: investmentsDE = [] } = useQuery({
    queryKey: ['investmentsDE', taxYear],
    queryFn: () => base44.entities.Investment.filter({ tax_year: taxYear }) || []
  });

  const { data: investmentsAT = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  const { data: investmentsCH = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear],
    queryFn: () => base44.entities.InvestmentCH.filter({ tax_year: taxYear }) || []
  });

  const checklist_items = [
    {
      id: 'de_investments',
      country: '🇩🇪 Deutschland',
      title: 'Kapitalanlagen erfasst',
      description: 'Alle Investments in Anlage KAP dokumentiert',
      completed: checklist.de_investments || investmentsDE.length > 0,
      count: investmentsDE.length,
      link: '/steuer/anlage-kap'
    },
    {
      id: 'de_other_income',
      country: '🇩🇪 Deutschland',
      title: 'Sonstige Einkünfte',
      description: 'Alle übrigen Einkünfte in Anlage SO erfasst',
      completed: checklist.de_other_income,
      count: 0,
      link: '/steuer/anlage-so'
    },
    {
      id: 'de_capital_gains',
      country: '🇩🇪 Deutschland',
      title: 'Veräußerungsgewinne',
      description: 'Alle Verkäufe in Anlage VG dokumentiert',
      completed: checklist.de_capital_gains,
      count: 0,
      link: '/steuer/anlage-vg'
    },
    {
      id: 'at_investments',
      country: '🇦🇹 Österreich',
      title: 'E1kv - Kapitalvermögen',
      description: 'Österreich Kapitalanlagen erfasst',
      completed: checklist.at_investments || investmentsAT.length > 0,
      count: investmentsAT.length,
      link: '/at/anlage-kap'
    },
    {
      id: 'at_other_income',
      country: '🇦🇹 Österreich',
      title: 'Sonstige Einkünfte',
      description: 'Österreichische sonstige Einkünfte erfasst',
      completed: checklist.at_other_income,
      count: 0,
      link: '/at/anlage-so'
    },
    {
      id: 'ch_investments',
      country: '🇨🇭 Schweiz',
      title: 'Wertschriften',
      description: 'Schweizer Wertschriften erfasst',
      completed: checklist.ch_investments || investmentsCH.length > 0,
      count: investmentsCH.length,
      link: '/ch/investments'
    },
    {
      id: 'ch_real_estate',
      country: '🇨🇭 Schweiz',
      title: 'Liegenschaften',
      description: 'Schweizer Immobilien erfasst',
      completed: checklist.ch_real_estate,
      count: 0,
      link: '/ch/real-estate'
    }
  ];

  const handleToggle = (id) => {
    setChecklist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const completedCount = Object.values(checklist).filter(v => v).length;
  const totalCount = Object.keys(checklist).length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);

  const handleExportChecklist = () => {
    const content = `DACH Steuererklärung ${taxYear} - Compliance Checkliste\n\n${checklist_items.map(item => `[${checklist[item.id] ? 'X' : ' '}] ${item.country} - ${item.title}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-checklist-${taxYear}.txt`;
    a.click();
    toast.success('Checkliste exportiert');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">✅ DACH Compliance Checkliste {taxYear}</h1>
        <Button onClick={handleExportChecklist} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Exportieren
        </Button>
      </div>

      {/* Progress */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600">Completion Status</p>
              <p className="text-3xl font-bold">{completionPercent}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">{completedCount} von {totalCount}</p>
              <p className="text-2xl font-bold">{totalCount - completedCount} Aufgaben</p>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {completionPercent < 50 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>⚠️ Unvollständige Steuererklärung</AlertTitle>
          <AlertDescription>
            Bitte füllen Sie mindestens 50% der Checkliste aus, bevor Sie exportieren.
          </AlertDescription>
        </Alert>
      )}

      {completionPercent === 100 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>✅ Alle Aufgaben abgeschlossen!</AlertTitle>
          <AlertDescription>
            Ihre DACH-Steuererklärung ist vollständig und bereit zum Export.
          </AlertDescription>
        </Alert>
      )}

      {/* Checklist Items Grouped by Country */}
      {['🇩🇪 Deutschland', '🇦🇹 Österreich', '🇨🇭 Schweiz'].map(country => {
        const items = checklist_items.filter(item => item.country === country);
        return (
          <div key={country}>
            <h3 className="text-lg font-bold mb-3">{country}</h3>
            <div className="grid gap-3 mb-6">
              {items.map(item => (
                <Card key={item.id} className={item.completed ? 'border-green-200 bg-green-50' : 'border-slate-200'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={checklist[item.id]}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-bold">{item.title}</p>
                        <p className="text-sm text-slate-600">{item.description}</p>
                        {item.count > 0 && (
                          <Badge className="mt-2 bg-blue-100 text-blue-800">{item.count} Einträge</Badge>
                        )}
                      </div>
                      {item.completed && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2">
          <AlertCircle className="w-4 h-4" /> Validieren
        </Button>
        <Button disabled={completionPercent < 100} className="gap-2 ml-auto bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4" /> Alle Dateien exportieren
        </Button>
      </div>
    </div>
  );
}