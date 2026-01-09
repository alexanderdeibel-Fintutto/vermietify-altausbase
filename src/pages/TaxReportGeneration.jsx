import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxReportGeneration() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [generating, setGenerating] = useState(false);

  const { data: report = {}, isLoading } = useQuery({
    queryKey: ['comprehensiveTaxReport', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateComprehensiveTaxReport', {
        country,
        taxYear
      });
      return response.data?.report || {};
    },
    enabled: generating
  });

  const handleDownloadPDF = () => {
    const content = JSON.stringify(report, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `tax-report-${country}-${taxYear}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📄 Steuerbericht Generierung</h1>
        <p className="text-slate-500 mt-1">Erstellen Sie professionelle Steuerberichte</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => setGenerating(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={generating}
          >
            {generating && isLoading ? 'Wird erstellt...' : 'Bericht erstellen'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">⏳ Bericht wird erstellt...</div>
      ) : generating && report.content ? (
        <>
          {/* Report Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{report.content.report_title}</CardTitle>
              <p className="text-xs text-slate-600 mt-2">Generiert: {new Date(report.generated_at).toLocaleDateString('de-DE')}</p>
            </CardHeader>
          </Card>

          {/* Executive Summary */}
          {report.content.executive_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.content.executive_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          {report.content.key_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Schlüsselmetriken</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.content.key_metrics).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-blue-300 pl-3">
                    <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-lg font-bold mt-1">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Calculation Overview */}
          {report.content.calculation_overview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🧮 Berechnungsübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(report.content.calculation_overview).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-slate-50 rounded text-sm">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {report.content.risk_assessment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Risikobewertung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.content.risk_assessment}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(report.content.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.content.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {(report.content.next_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📍 Nächste Schritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.content.next_steps.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-blue-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Export */}
          <Button onClick={handleDownloadPDF} className="w-full bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Bericht herunterladen
          </Button>
        </>
      ) : (
        <div className="text-center py-12 text-slate-500">
          Klicken Sie "Bericht erstellen", um einen umfassenden Steuerbericht zu generieren
        </div>
      )}
    </div>
  );
}