import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Download, Share2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxReportingHub() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [reportType, setReportType] = useState('comprehensive');
  const [generating, setGenerating] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxReport', country, taxYear, reportType],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxReport', {
        country,
        tax_year: taxYear,
        report_type: reportType
      });
      return response.data || {};
    },
    enabled: generating
  });

  const handleExport = async () => {
    await base44.functions.invoke('exportTaxReportPDF', {
      report_data: result.report,
      country,
      tax_year: taxYear
    });
  };

  const handleShare = async () => {
    if (!shareEmail) return;
    await base44.functions.invoke('shareWithTaxAdvisor', {
      advisor_email: shareEmail,
      tax_year: taxYear,
      country,
      data_types: [reportType]
    });
    setShareEmail('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Steuerbericht-Hub</h1>
        <p className="text-slate-500 mt-1">Erstellen, exportieren und teilen Sie umfassende Steuerberichte</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Bericht-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={generating}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={generating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Berichttyp</label>
              <Select value={reportType} onValueChange={setReportType} disabled={generating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Umfassend</SelectItem>
                  <SelectItem value="summary">Zusammenfassung</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setGenerating(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
              disabled={generating}
            >
              {generating ? '⏳...' : 'Erstellen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird generiert...</div>
      ) : generating && result.report ? (
        <>
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-sm">{result.report.report_title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{result.report.executive_summary}</p>
              <div className="flex gap-2">
                <Button onClick={handleExport} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Exportieren
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Teilen
                </Button>
              </div>
            </CardContent>
          </Card>

          {(result.report.sections || []).length > 0 && (
            <div className="space-y-3">
              {result.report.sections.map((section, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{section.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Klicken Sie "Erstellen", um einen Bericht zu generieren</div>
      )}
    </div>
  );
}