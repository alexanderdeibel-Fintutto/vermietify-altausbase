import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxReportGeneration() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showReport, setShowReport] = useState(false);

  const { data: report = {}, isLoading } = useQuery({
    queryKey: ['taxReport', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateComprehensiveTaxReport', {
        country,
        taxYear
      });
      return response.data?.report || {};
    },
    enabled: showReport
  });

  const handleExport = async () => {
    const content = `
TAX REPORT - ${country} ${taxYear}
Generated: ${new Date().toLocaleDateString('de-DE')}

EXECUTIVE SUMMARY
${report.content?.executive_summary || 'N/A'}

KEY METRICS
${Object.entries(report.content?.key_metrics || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

RECOMMENDATIONS
${(report.content?.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${country}-${taxYear}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📄 Tax Report Generation</h1>
        <p className="text-slate-500 mt-1">Erstellen Sie umfassende Steuerberichte</p>
      </div>

      {/* Controls */}
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">📋 Report-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(CURRENT_YEAR - 2)}>{CURRENT_YEAR - 2}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => setShowReport(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Report Generieren
          </Button>
        </CardContent>
      </Card>

      {isLoading && showReport && (
        <div className="text-center py-8">⏳ Report wird generiert...</div>
      )}

      {showReport && report.content && (
        <>
          {/* Executive Summary */}
          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">📊 Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              {report.content?.executive_summary || 'N/A'}
            </CardContent>
          </Card>

          {/* Key Metrics */}
          {report.content?.key_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Schlüsselkennzahlen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(report.content.key_metrics).map(([key, value]) => (
                    <div key={key} className="p-3 bg-slate-50 rounded border">
                      <p className="text-xs text-slate-600 truncate">{key}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax Breakdown */}
          {report.content?.tax_breakdown && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Steueraufschlüsselung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(report.content.tax_breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-slate-50 rounded text-sm">
                    <span className="font-medium">{key}</span>
                    <span className="text-blue-600 font-bold">€{typeof value === 'number' ? value.toLocaleString() : value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Score */}
          {report.content?.compliance_score !== undefined && (
            <Card className="bg-green-50 border-green-300">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Compliance-Score</p>
                  <p className="text-4xl font-bold text-green-600 mt-2">
                    {Math.round(report.content.compliance_score)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical Items */}
          {(report.content?.critical_items || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm">🚨 Kritische Punkte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.content.critical_items.map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0">!</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(report.content?.recommendations || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.content.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-white rounded">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {(report.content?.next_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Nächste Schritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.content.next_steps.map((step, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="flex-shrink-0">→</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Report Exportieren
          </Button>
        </>
      )}
    </div>
  );
}