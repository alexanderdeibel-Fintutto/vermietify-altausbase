import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ComplianceDashboard({ year }) {
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateComplianceReport', {
        year: year || new Date().getFullYear(),
        format: 'json'
      });

      setReport(response.data);
      toast.success('Compliance-Report generiert');
    } catch (error) {
      toast.error('Report-Generierung fehlgeschlagen');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await base44.functions.invoke('generateComplianceReport', {
        year: year || new Date().getFullYear(),
        format: 'pdf'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_report_${year}.pdf`;
      a.click();
    } catch (error) {
      toast.error('PDF-Download fehlgeschlagen');
    }
  };

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance-Bericht</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Generieren Sie einen umfassenden GoBD-Compliance-Bericht für {year}
          </p>
          <Button onClick={handleGenerateReport} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird generiert...
              </>
            ) : (
              'Report generieren'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance-Bericht {report.year}</CardTitle>
            <Button size="sm" onClick={downloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compliance Score */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-700">Compliance Score</div>
                <div className="text-3xl font-bold text-blue-900">{report.metrics.compliance_score}/100</div>
              </div>
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                <div className="text-2xl font-bold text-blue-600">{report.metrics.compliance_score}%</div>
              </div>
            </div>
          </div>

          {/* Metriken */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded">
              <div className="text-xs text-slate-600">Einreichungen</div>
              <div className="text-2xl font-bold">{report.metrics.total_submissions}</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-xs text-slate-600">Akzeptanzquote</div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((report.metrics.accepted / report.metrics.total_submissions) * 100)}%
              </div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-xs text-slate-600">Fehlerquote</div>
              <div className="text-2xl font-bold text-red-600">{report.metrics.error_rate}%</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-xs text-slate-600">KI-Vertrauen</div>
              <div className="text-2xl font-bold text-yellow-600">{report.metrics.avg_ai_confidence}%</div>
            </div>
          </div>

          {/* GoBD Compliance */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="font-medium text-sm mb-3">GoBD-Compliance</div>
            {Object.entries(report.gobdCompliance).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                <Badge variant={value ? 'default' : 'destructive'}>
                  {value ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      OK
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      FEHLER
                    </>
                  )}
                </Badge>
              </div>
            ))}
          </div>

          {/* Empfehlungen */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <div className="font-medium text-sm mb-2">Empfehlungen</div>
              <ul className="space-y-1">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-yellow-800 flex gap-2">
                    <span>•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}