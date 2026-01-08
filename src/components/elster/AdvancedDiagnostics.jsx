import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Stethoscope, AlertTriangle, CheckCircle, Info,
  Loader2, Download, RefreshCw, XCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AdvancedDiagnostics({ submission }) {
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Führe eine umfassende technische Diagnose dieser ELSTER-Einreichung durch:

FORMULAR: ${submission.tax_form_type}
JAHR: ${submission.tax_year}
STATUS: ${submission.status}
RECHTSFORM: ${submission.legal_form}

FORMULARDATEN:
${JSON.stringify(submission.form_data, null, 2)}

VALIDIERUNGSFEHLER:
${JSON.stringify(submission.validation_errors, null, 2)}

WARNUNGEN:
${JSON.stringify(submission.validation_warnings, null, 2)}

Analysiere systematisch:
1. Datenqualität (Vollständigkeit, Konsistenz, Plausibilität)
2. Technische Probleme (XML-Struktur, Formatierung, Encoding)
3. Compliance-Verstöße (Steuerrecht, ELSTER-Richtlinien)
4. Performance-Probleme (Dateigröße, Verarbeitungszeit)
5. Sicherheitsaspekte (Verschlüsselung, Zertifikate)

Für jedes Problem:
- Kategorie (data/technical/compliance/performance/security)
- Schweregrad (critical/high/medium/low)
- Detaillierte Beschreibung
- Root Cause
- Konkrete Lösungsschritte
- Präventionsmaßnahmen`,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_health_score: { type: 'number' },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  severity: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  root_cause: { type: 'string' },
                  solution_steps: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  prevention: { type: 'string' }
                }
              }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            },
            risk_assessment: { type: 'string' }
          }
        }
      });

      setDiagnostics(response);
      toast.success('Diagnose abgeschlossen');
    } catch (error) {
      toast.error('Diagnose fehlgeschlagen');
      console.error(error);
    } finally {
      setDiagnosing(false);
    }
  };

  const severityConfig = {
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  };

  const categoryLabels = {
    data: 'Datenqualität',
    technical: 'Technisch',
    compliance: 'Compliance',
    performance: 'Performance',
    security: 'Sicherheit'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          Erweiterte Diagnose
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!diagnostics ? (
          <div className="text-center py-8">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 mb-4">
              Umfassende technische Analyse der Einreichung
            </p>
            <Button
              onClick={handleDiagnose}
              disabled={diagnosing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {diagnosing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Stethoscope className="w-4 h-4 mr-2" />
              )}
              Diagnose starten
            </Button>
          </div>
        ) : (
          <>
            {/* Health Score */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Gesundheits-Score</span>
                <span className="text-2xl font-bold text-blue-700">
                  {diagnostics.overall_health_score}/100
                </span>
              </div>
              <Progress value={diagnostics.overall_health_score} className="h-2" />
            </div>

            {/* Issues */}
            {diagnostics.issues && diagnostics.issues.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Gefundene Probleme ({diagnostics.issues.length})</h3>
                <Accordion type="single" collapsible>
                  {diagnostics.issues.map((issue, idx) => {
                    const config = severityConfig[issue.severity.toLowerCase()] || severityConfig.low;
                    const IssueIcon = config.icon;

                    return (
                      <AccordionItem key={idx} value={`issue-${idx}`}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3 text-left">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <IssueIcon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{issue.title}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline">
                                  {categoryLabels[issue.category]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-14 space-y-3">
                            <div>
                              <div className="text-xs font-medium text-slate-700 mb-1">Beschreibung:</div>
                              <p className="text-sm text-slate-600">{issue.description}</p>
                            </div>

                            <div>
                              <div className="text-xs font-medium text-slate-700 mb-1">Ursache:</div>
                              <p className="text-sm text-slate-600">{issue.root_cause}</p>
                            </div>

                            {issue.solution_steps && issue.solution_steps.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-slate-700 mb-2">Lösungsschritte:</div>
                                <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1">
                                  {issue.solution_steps.map((step, stepIdx) => (
                                    <li key={stepIdx}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {issue.prevention && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="text-xs font-medium text-blue-700 mb-1">Prävention:</div>
                                <p className="text-sm text-blue-600">{issue.prevention}</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}

            {/* Recommendations */}
            {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Empfehlungen</h3>
                <div className="space-y-2">
                  {diagnostics.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {diagnostics.risk_assessment && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-sm text-yellow-900 mb-2">
                  Risikobewertung
                </div>
                <p className="text-sm text-yellow-800">{diagnostics.risk_assessment}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDiagnose}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Neu scannen
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const report = JSON.stringify(diagnostics, null, 2);
                  const blob = new Blob([report], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'diagnose-report.json';
                  a.click();
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}