import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartCorrectionDialog({ submission, open, onOpenChange, onCorrectionApplied }) {
  const [processing, setProcessing] = useState(false);
  const [corrections, setCorrections] = useState(null);

  const handleAnalyze = async () => {
    setProcessing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere folgende Steuerformular-Fehler und schlage Korrekturen vor:

Formular: ${submission.tax_form_type}
Jahr: ${submission.tax_year}
Rechtsform: ${submission.legal_form}

Fehler:
${submission.validation_errors?.map(e => `- ${e.field}: ${e.message}`).join('\n') || 'Keine'}

Warnungen:
${submission.validation_warnings?.map(w => `- ${w.field}: ${w.message}`).join('\n') || 'Keine'}

Aktuelle Formulardaten:
${JSON.stringify(submission.form_data, null, 2)}

Bitte gib für jeden Fehler/Warnung eine konkrete Korrektur-Empfehlung mit:
1. Feld-Name
2. Aktueller Wert
3. Empfohlener Wert
4. Begründung`,
        response_json_schema: {
          type: 'object',
          properties: {
            corrections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  current_value: { type: 'string' },
                  suggested_value: { type: 'string' },
                  reason: { type: 'string' },
                  confidence: { type: 'number' }
                }
              }
            }
          }
        }
      });

      setCorrections(response.corrections || []);
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyCorrections = async () => {
    if (!corrections || corrections.length === 0) return;

    setProcessing(true);
    try {
      const updatedFormData = { ...submission.form_data };
      
      corrections.forEach(corr => {
        if (corr.confidence >= 70) {
          updatedFormData[corr.field] = corr.suggested_value;
        }
      });

      await base44.entities.ElsterSubmission.update(submission.id, {
        form_data: updatedFormData
      });

      toast.success('Korrekturen angewendet');
      onCorrectionApplied?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Anwendung fehlgeschlagen');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            KI-gestützte Fehlerkorrektur
          </DialogTitle>
        </DialogHeader>

        {!corrections ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Die KI analysiert Ihre Fehler und schlägt automatische Korrekturen vor.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-slate-50 rounded">
              <div className="text-sm font-medium mb-2">Zu korrigierende Probleme:</div>
              <div className="space-y-1">
                <div className="text-sm">
                  • {submission.validation_errors?.length || 0} Fehler
                </div>
                <div className="text-sm">
                  • {submission.validation_warnings?.length || 0} Warnungen
                </div>
              </div>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Fehler analysieren
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              {corrections.length} Korrekturvorschläge gefunden
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {corrections.map((corr, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{corr.field}</div>
                    <Badge variant={corr.confidence >= 80 ? 'default' : 'secondary'}>
                      {corr.confidence}% Vertrauen
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600">{corr.current_value || 'leer'}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-green-700">{corr.suggested_value}</span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    {corr.reason}
                  </div>

                  {corr.confidence < 70 && (
                    <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                      ⚠️ Niedriges Vertrauen - manuelle Prüfung empfohlen
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {corrections && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleApplyCorrections}
              disabled={processing || corrections.filter(c => c.confidence >= 70).length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Korrekturen anwenden ({corrections.filter(c => c.confidence >= 70).length})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}