import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Loader2, FileCheck, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";

export default function ValidationReport({ submission }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateValidationReport', {
        submission_id: submission.id
      });

      if (response.data.success) {
        setReport(response.data.report);
        toast.success('Validierungs-Report erstellt');
      }
    } catch (error) {
      toast.error('Report-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'acceptable': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'excellent': return 'Exzellent';
      case 'good': return 'Gut';
      case 'acceptable': return 'Akzeptabel';
      default: return 'Verbesserungsbedarf';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Validierungs-Report
          </CardTitle>
          <Button onClick={generateReport} disabled={loading} size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generieren'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!report ? (
          <div className="text-center py-8 text-slate-600">
            <FileCheck className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-sm">Klicken Sie auf "Generieren" für einen detaillierten Validierungs-Report</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`p-4 rounded-lg ${getStatusColor(report.overall_status)} bg-opacity-10 border border-opacity-20`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Gesamt-Status</div>
                  <div className="text-xl font-bold">{getStatusLabel(report.overall_status)}</div>
                </div>
                {report.overall_status === 'excellent' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-2xl font-bold text-slate-900">{report.completeness}%</div>
                <div className="text-xs text-slate-600">Vollständigkeit</div>
              </div>
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-2xl font-bold text-slate-900">{report.accuracy}%</div>
                <div className="text-xs text-slate-600">Genauigkeit</div>
              </div>
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-2xl font-bold text-slate-900">{report.compliance}%</div>
                <div className="text-xs text-slate-600">Compliance</div>
              </div>
            </div>

            {/* Sections */}
            {report.sections.map((section, idx) => (
              <div key={idx} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {section.status === 'pass' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium text-sm">{section.name}</span>
                  </div>
                  <Badge variant={section.status === 'pass' ? 'default' : 'destructive'}>
                    {section.score}%
                  </Badge>
                </div>
                <Progress value={section.score} className="h-2 mb-2" />
                <p className="text-xs text-slate-600">{section.details}</p>
                
                {section.issues.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {section.issues.slice(0, 3).map((issue, i) => (
                      <div key={i} className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {issue.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Empfehlungen</div>
                {report.recommendations.map((rec, idx) => (
                  <Alert key={idx} className={rec.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}>
                    <AlertDescription className="text-sm">
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-xs mt-1">{rec.description}</div>
                      <div className="text-xs mt-1 text-slate-600">→ {rec.action}</div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}