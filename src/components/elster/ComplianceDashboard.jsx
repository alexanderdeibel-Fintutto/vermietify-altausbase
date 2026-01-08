import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, AlertTriangle, XCircle, Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";

export default function ComplianceDashboard({ year }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateComplianceReport', {
        year: year || new Date().getFullYear()
      });

      if (response.data.success) {
        setReport(response.data.report);
        toast.success('Compliance-Bericht erstellt');
      }
    } catch (error) {
      toast.error('Bericht-Erstellung fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (passed) => {
    return passed ? CheckCircle : XCircle;
  };

  const getStatusColor = (passed) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getComplianceColor = (level) => {
    switch (level) {
      case 'excellent': return 'bg-green-600';
      case 'good': return 'bg-blue-600';
      case 'acceptable': return 'bg-yellow-600';
      default: return 'bg-red-600';
    }
  };

  const getComplianceLabel = (level) => {
    switch (level) {
      case 'excellent': return 'Hervorragend';
      case 'good': return 'Gut';
      case 'acceptable': return 'Akzeptabel';
      default: return 'Verbesserung nötig';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Compliance-Dashboard
            </CardTitle>
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Bericht erstellen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!report ? (
            <div className="text-center py-12 text-slate-600">
              Klicken Sie auf "Bericht erstellen" um einen Compliance-Bericht zu generieren
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">{report.overall_score}%</div>
                <Badge className={getComplianceColor(report.compliance_level)}>
                  {getComplianceLabel(report.compliance_level)}
                </Badge>
                <div className="text-sm text-slate-600 mt-2">
                  Bericht für {report.year} · Erstellt: {new Date(report.generated_at).toLocaleString('de-DE')}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">{report.summary.total_submissions}</div>
                  <div className="text-sm text-slate-600">Total</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{report.summary.accepted}</div>
                  <div className="text-sm text-slate-600">Akzeptiert</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{report.summary.pending}</div>
                  <div className="text-sm text-slate-600">Ausstehend</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-slate-600">{report.summary.archived}</div>
                  <div className="text-sm text-slate-600">Archiviert</div>
                </div>
              </div>

              {/* Checks */}
              <div className="space-y-3">
                <h3 className="font-medium">Compliance-Checks</h3>
                {Object.entries(report.checks).map(([key, check]) => {
                  const Icon = getStatusIcon(check.passed);
                  return (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${getStatusColor(check.passed)}`} />
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        </div>
                        <Badge variant="outline">{Math.round(check.score)}%</Badge>
                      </div>
                      <Progress value={check.score} className="mb-2" />
                      <div className="text-sm text-slate-600">{check.details}</div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Empfehlungen:</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {report.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}