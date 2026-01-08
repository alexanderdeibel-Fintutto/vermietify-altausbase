import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, AlertTriangle, Download, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ComplianceDashboard({ year }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ['compliance-report', year],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateComplianceReport', { 
        year,
        include_details: true 
      });
      return response.data.report;
    }
  });

  const handleExportReport = async () => {
    try {
      const response = await base44.functions.invoke('generateComplianceReport', { 
        year,
        include_details: true 
      });
      
      const blob = new Blob([JSON.stringify(response.data.report, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_report_${year}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Compliance-Report exportiert');
    } catch (error) {
      toast.error('Export fehlgeschlagen');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Lade Compliance-Report...</div>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  const complianceScore = Object.values(report.compliance_checks).filter(v => v === true).length / 
                          Object.values(report.compliance_checks).length * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Compliance-Dashboard {year}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Report exportieren
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Gesamt-Compliance</span>
              <Badge variant={complianceScore === 100 ? 'default' : 'secondary'}>
                {Math.round(complianceScore)}%
              </Badge>
            </div>
            <Progress value={complianceScore} className="h-2" />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold">{report.summary.total_submissions}</div>
              <div className="text-xs text-slate-600">Gesamt</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{report.summary.accepted}</div>
              <div className="text-xs text-green-600">Akzeptiert</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{report.summary.pending}</div>
              <div className="text-xs text-yellow-600">Wartend</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{report.summary.archived}</div>
              <div className="text-xs text-blue-600">Archiviert</div>
            </div>
          </div>

          {/* Compliance Checks */}
          <div>
            <h4 className="font-medium mb-3">Compliance-Prüfungen</h4>
            <div className="space-y-2">
              {Object.entries(report.compliance_checks).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                  {value ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Quality */}
          <div>
            <h4 className="font-medium mb-3">Datenqualität</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <div className="text-sm text-slate-600">Ø KI-Vertrauen</div>
                <div className="text-2xl font-bold">{report.data_quality.avg_ai_confidence}%</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-slate-600">Validierungsrate</div>
                <div className="text-2xl font-bold">{report.data_quality.validation_pass_rate}%</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-slate-600">Fehler gesamt</div>
                <div className="text-2xl font-bold text-red-600">{report.data_quality.total_errors}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-slate-600">Warnungen</div>
                <div className="text-2xl font-bold text-yellow-600">{report.data_quality.total_warnings}</div>
              </div>
            </div>
          </div>

          {/* GoBD Compliance */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              GoBD-Compliance
            </h4>
            <div className="space-y-2">
              {report.gobd_compliance.requirements_met.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Empfehlungen
              </h4>
              <div className="space-y-2">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 rounded text-sm text-yellow-800">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}