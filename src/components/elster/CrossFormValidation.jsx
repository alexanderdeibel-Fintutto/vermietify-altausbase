import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GitCompare, Loader2, CheckCircle, AlertTriangle,
  ArrowRight, XCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CrossFormValidation({ submissions }) {
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState(null);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Führe eine formularübergreifende Konsistenzprüfung durch für alle ELSTER-Einreichungen:

${submissions.map(s => `
${s.tax_form_type} (${s.tax_year}):
- Einnahmen: ${s.form_data?.einnahmen || 0}
- Ausgaben: ${s.form_data?.werbungskosten || 0}
- Überschuss: ${s.form_data?.ueberschuss || 0}
`).join('\n')}

Prüfe auf Inkonsistenzen:
1. Summen-Plausibilität zwischen verschiedenen Formularen
2. Zeitliche Konsistenz (gleiche Periode)
3. Doppelerfassungen
4. Fehlende Querverweise
5. Unstimmigkeiten bei USt-VA vs. Jahreserklärung
6. EÜR vs. Anlage V Abweichungen
7. Gewerbesteuer-Bemessungsgrundlage vs. Gewinn

Für jede Inkonsistenz:
- Betroffene Formulare
- Beschreibung der Abweichung
- Schweregrad
- Empfohlene Korrektur`,
        response_json_schema: {
          type: 'object',
          properties: {
            inconsistencies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  forms_affected: { 
                    type: 'array',
                    items: { type: 'string' }
                  },
                  description: { type: 'string' },
                  severity: { type: 'string' },
                  expected_value: { type: 'string' },
                  actual_value: { type: 'string' },
                  recommended_fix: { type: 'string' },
                  impact: { type: 'string' }
                }
              }
            },
            overall_consistency_score: { type: 'number' },
            summary: { type: 'string' }
          }
        }
      });

      setResults(response);
      toast.success('Cross-Validierung abgeschlossen');
    } catch (error) {
      toast.error('Validierung fehlgeschlagen');
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  const severityConfig = {
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-blue-600" />
          Formularübergreifende Validierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results ? (
          <div className="text-center py-8">
            <GitCompare className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 mb-4">
              Prüft Konsistenz zwischen allen Steuerformularen
            </p>
            <Button
              onClick={handleValidate}
              disabled={validating || submissions.length < 2}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {validating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GitCompare className="w-4 h-4 mr-2" />
              )}
              {submissions.length} Formulare prüfen
            </Button>
          </div>
        ) : (
          <>
            {/* Score */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Konsistenz-Score</span>
                <span className="text-2xl font-bold text-blue-700">
                  {results.overall_consistency_score}/100
                </span>
              </div>
              <Progress value={results.overall_consistency_score} className="h-2" />
            </div>

            {/* Summary */}
            {results.summary && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                {results.summary}
              </div>
            )}

            {/* Inconsistencies */}
            {results.inconsistencies && results.inconsistencies.length > 0 ? (
              <div className="space-y-3">
                <div className="font-semibold">
                  Gefundene Inkonsistenzen ({results.inconsistencies.length})
                </div>
                {results.inconsistencies.map((inc, idx) => {
                  const config = severityConfig[inc.severity?.toLowerCase()] || severityConfig.low;
                  const Icon = config.icon;

                  return (
                    <div key={idx} className={`p-4 border rounded-lg ${config.bg} ${config.border}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <Icon className={`w-5 h-5 ${config.color} mt-0.5`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
                              {inc.severity}
                            </Badge>
                            {inc.forms_affected?.map((form, formIdx) => (
                              <Badge key={formIdx} variant="outline" className="text-xs">
                                {form}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="text-sm text-slate-700 mb-3">
                            {inc.description}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div className="p-2 bg-red-50 border border-red-200 rounded">
                              <div className="text-xs text-red-600 mb-1">Aktuell:</div>
                              <div className="font-mono text-xs">{inc.actual_value}</div>
                            </div>
                            <div className="p-2 bg-green-50 border border-green-200 rounded">
                              <div className="text-xs text-green-600 mb-1">Erwartet:</div>
                              <div className="font-mono text-xs">{inc.expected_value}</div>
                            </div>
                          </div>

                          <div className="p-3 bg-white border rounded text-sm">
                            <div className="font-medium mb-1">Empfohlene Korrektur:</div>
                            <div className="text-slate-700">{inc.recommended_fix}</div>
                          </div>

                          {inc.impact && (
                            <div className="mt-2 text-xs text-slate-600">
                              <strong>Auswirkung:</strong> {inc.impact}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <div className="font-medium text-green-900">Keine Inkonsistenzen gefunden</div>
                <div className="text-sm text-green-700 mt-1">
                  Alle Formulare sind konsistent
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setResults(null)}
              className="w-full"
            >
              Neue Prüfung
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}