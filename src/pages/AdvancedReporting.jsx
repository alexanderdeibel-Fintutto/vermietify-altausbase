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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Zap } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const REPORT_TYPES = [
  { value: 'comprehensive', label: '📋 Umfassend' },
  { value: 'executive', label: '👔 Executive Summary' },
  { value: 'compliance', label: '✅ Compliance' },
  { value: 'risk', label: '⚠️ Risiko' },
  { value: 'optimization', label: '💡 Optimierung' }
];

export default function AdvancedReporting() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [reportType, setReportType] = useState('comprehensive');

  const { data: report = {}, isLoading, refetch } = useQuery({
    queryKey: ['advancedReport', country, taxYear, reportType],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAdvancedReporting', {
        country,
        taxYear,
        reportType
      });
      return response.data?.report || {};
    },
    enabled: false
  });

  const handleGenerateReport = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Advanced Reporting</h1>
        <p className="text-slate-500 mt-1">Erstellen Sie maßgeschneiderte Steuerberichte</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report-Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Report-Typ</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-spin" />
                Generiere Report...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Report Generieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {report.report && (
        <>
          {/* Executive Summary */}
          {report.report.executive_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📌 Executive Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 leading-relaxed">
                {report.report.executive_summary}
              </CardContent>
            </Card>
          )}

          {/* Key Findings */}
          {(report.report.key_findings || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔍 Wichtigste Erkenntnisse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.report.key_findings.map((finding, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <Badge className="flex-shrink-0 bg-blue-100 text-blue-800 text-xs mt-0.5">
                      {i + 1}
                    </Badge>
                    <span>{finding}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Metrics */}
          {report.report.metrics && Object.keys(report.report.metrics).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Kennzahlen</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(report.report.metrics).map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-lg font-bold mt-1">{String(value).substring(0, 20)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Analysis */}
          {report.report.analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Analyse</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 leading-relaxed">
                {report.report.analysis}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(report.report.recommendations || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✅ Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.report.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-green-600 flex-shrink-0">→</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {(report.report.next_steps || []).length > 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900">
                <strong className="text-sm">🎯 Nächste Schritte:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  {report.report.next_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Export Options */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              PDF Exportieren
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Excel Exportieren
            </Button>
          </div>
        </>
      )}
    </div>
  );
}