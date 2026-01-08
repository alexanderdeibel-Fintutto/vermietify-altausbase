import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, Loader2, CheckCircle, AlertTriangle, 
  ArrowRight, Copy, ThumbsUp, ThumbsDown 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EnhancedSmartCorrection({ submission, open, onOpenChange, onCorrectionApplied }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState({});

  React.useEffect(() => {
    if (open && submission) {
      analyzErrors();
    }
  }, [open, submission]);

  const analyzeErrors = async () => {
    setAnalyzing(true);
    setSuggestions(null);

    try {
      const errors = submission.validation_errors || [];
      const warnings = submission.validation_warnings || [];
      const formData = submission.form_data || {};

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein ELSTER-Steuerexperte. Analysiere diese Validierungsfehler und schlage konkrete Korrekturen vor:

FEHLER:
${errors.map((e, i) => `${i + 1}. ${JSON.stringify(e)}`).join('\n')}

WARNUNGEN:
${warnings.map((w, i) => `${i + 1}. ${JSON.stringify(w)}`).join('\n')}

AKTUELLE FORMULARDATEN:
${JSON.stringify(formData, null, 2)}

Gib für jeden Fehler/Warnung:
1. Fehleranalyse (was ist das Problem?)
2. Konkrete Korrektur (welcher Wert sollte gesetzt werden?)
3. Begründung (warum ist das die richtige Korrektur?)
4. Confidence Score (0-100, wie sicher bist du?)
5. Alternative Lösungen falls zutreffend

Berücksichtige:
- Deutsche Steuergesetze (EStG, AO)
- ELSTER-XML-Validierungsregeln
- Plausibilitätsprüfungen
- Best Practices für Vermietung & Verpachtung`,
        response_json_schema: {
          type: 'object',
          properties: {
            corrections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  error_type: { type: 'string' },
                  current_value: { type: 'string' },
                  suggested_value: { type: 'string' },
                  explanation: { type: 'string' },
                  reasoning: { type: 'string' },
                  confidence: { type: 'number' },
                  alternatives: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  references: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  impact: { type: 'string' }
                }
              }
            },
            overall_assessment: { type: 'string' },
            risk_level: { type: 'string' }
          }
        }
      });

      setSuggestions(response);
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyCorrection = async (correction) => {
    setApplying(true);
    try {
      const updatedFormData = {
        ...submission.form_data,
        [correction.field]: correction.suggested_value
      };

      await base44.entities.ElsterSubmission.update(submission.id, {
        form_data: updatedFormData
      });

      toast.success('Korrektur angewendet');
      onCorrectionApplied?.();
    } catch (error) {
      toast.error('Korrektur fehlgeschlagen');
    } finally {
      setApplying(false);
    }
  };

  const applyAllCorrections = async () => {
    setApplying(true);
    try {
      const updatedFormData = { ...submission.form_data };
      
      suggestions.corrections.forEach(corr => {
        if (corr.confidence >= 80) {
          updatedFormData[corr.field] = corr.suggested_value;
        }
      });

      await base44.entities.ElsterSubmission.update(submission.id, {
        form_data: updatedFormData
      });

      toast.success(`${suggestions.corrections.filter(c => c.confidence >= 80).length} Korrekturen angewendet`);
      onCorrectionApplied?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Batch-Korrektur fehlgeschlagen');
    } finally {
      setApplying(false);
    }
  };

  const sendFeedback = async (correctionId, isPositive) => {
    setFeedback({ ...feedback, [correctionId]: isPositive });
    
    // Log feedback for ML improvement
    await base44.functions.invoke('logCorrectionFeedback', {
      submission_id: submission.id,
      correction_id: correctionId,
      is_positive: isPositive
    }).catch(() => {});
    
    toast.success('Danke für Ihr Feedback!');
  };

  const confidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const riskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            KI-gestützte Fehlerkorrektur
          </DialogTitle>
        </DialogHeader>

        {analyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-slate-600">Analysiere Fehler und generiere Lösungen...</p>
          </div>
        ) : suggestions ? (
          <div className="space-y-6">
            {/* Overall Assessment */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-2">Gesamtbewertung</h3>
                    <p className="text-sm text-slate-600">{suggestions.overall_assessment}</p>
                  </div>
                  <Badge className={riskColor(suggestions.risk_level)}>
                    Risiko: {suggestions.risk_level}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Corrections */}
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">
                  Alle ({suggestions.corrections?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="high-confidence">
                  Hohe Konfidenz ({suggestions.corrections?.filter(c => c.confidence >= 80).length || 0})
                </TabsTrigger>
                <TabsTrigger value="needs-review">
                  Prüfen ({suggestions.corrections?.filter(c => c.confidence < 80).length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {suggestions.corrections?.map((corr, idx) => (
                  <CorrectionCard 
                    key={idx}
                    correction={corr}
                    onApply={applyCorrection}
                    applying={applying}
                    onFeedback={(isPositive) => sendFeedback(idx, isPositive)}
                    feedback={feedback[idx]}
                  />
                ))}
              </TabsContent>

              <TabsContent value="high-confidence" className="space-y-4 mt-4">
                {suggestions.corrections?.filter(c => c.confidence >= 80).map((corr, idx) => (
                  <CorrectionCard 
                    key={idx}
                    correction={corr}
                    onApply={applyCorrection}
                    applying={applying}
                    onFeedback={(isPositive) => sendFeedback(idx, isPositive)}
                    feedback={feedback[idx]}
                  />
                ))}
              </TabsContent>

              <TabsContent value="needs-review" className="space-y-4 mt-4">
                {suggestions.corrections?.filter(c => c.confidence < 80).map((corr, idx) => (
                  <CorrectionCard 
                    key={idx}
                    correction={corr}
                    onApply={applyCorrection}
                    applying={applying}
                    onFeedback={(isPositive) => sendFeedback(idx, isPositive)}
                    feedback={feedback[idx]}
                  />
                ))}
              </TabsContent>
            </Tabs>

            {/* Bulk Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={applyAllCorrections}
                disabled={applying || !suggestions.corrections?.some(c => c.confidence >= 80)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {applying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Alle (≥80% Konfidenz) anwenden
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Schließen
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CorrectionCard({ correction, onApply, applying, onFeedback, feedback }) {
  const confidenceColor = (confidence) => {
    if (confidence >= 90) return 'border-green-500 bg-green-50';
    if (confidence >= 70) return 'border-blue-500 bg-blue-50';
    if (confidence >= 50) return 'border-yellow-500 bg-yellow-50';
    return 'border-red-500 bg-red-50';
  };

  return (
    <Card className={`border-l-4 ${confidenceColor(correction.confidence)}`}>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium mb-1">{correction.field}</div>
            <Badge variant="outline" className="text-xs">
              {correction.error_type}
            </Badge>
          </div>
          <Badge className="text-sm">
            {correction.confidence}% Konfidenz
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-600 mb-1">Aktueller Wert:</div>
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm font-mono">
              {correction.current_value || '(leer)'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">Empfohlener Wert:</div>
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm font-mono">
              {correction.suggested_value}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">Erklärung:</div>
            <p className="text-sm text-slate-600">{correction.explanation}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">Begründung:</div>
            <p className="text-sm text-slate-600">{correction.reasoning}</p>
          </div>
        </div>

        {correction.references && correction.references.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">Rechtsgrundlagen:</div>
            <div className="flex flex-wrap gap-1">
              {correction.references.map((ref, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {correction.alternatives && correction.alternatives.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">Alternativen:</div>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              {correction.alternatives.map((alt, idx) => (
                <li key={idx}>{alt}</li>
              ))}
            </ul>
          </div>
        )}

        {correction.impact && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-xs font-medium text-blue-700 mb-1">Auswirkung:</div>
            <p className="text-sm text-blue-600">{correction.impact}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onApply(correction)}
            disabled={applying}
            size="sm"
            className="flex-1"
          >
            {applying ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3 mr-1" />
            )}
            Anwenden
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(correction.suggested_value);
              toast.success('In Zwischenablage kopiert');
            }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          {feedback === undefined && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFeedback(true)}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFeedback(false)}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}