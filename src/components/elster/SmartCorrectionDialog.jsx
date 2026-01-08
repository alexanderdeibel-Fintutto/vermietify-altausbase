import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartCorrectionDialog({ plausibilityResult, submission, open, onOpenChange, onSuccess }) {
  const [corrections, setCorrections] = useState({});
  const [saving, setSaving] = useState(false);

  if (!plausibilityResult || !submission) return null;

  const issues = [
    ...(plausibilityResult.errors || []),
    ...(plausibilityResult.warnings || [])
  ];

  const handleCorrect = (issue) => {
    if (issue.suggested_value !== undefined) {
      setCorrections({
        ...corrections,
        [issue.field]: issue.suggested_value
      });
    }
  };

  const handleSave = async () => {
    if (Object.keys(corrections).length === 0) {
      toast.error('Keine Korrekturen ausgewählt');
      return;
    }

    setSaving(true);
    try {
      const updatedFormData = {
        ...submission.form_data,
        ...corrections
      };

      await base44.entities.ElsterSubmission.update(submission.id, {
        form_data: updatedFormData,
        status: 'DRAFT'
      });

      toast.success('Korrekturen gespeichert');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Speichern fehlgeschlagen');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Intelligente Korrekturen
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <AlertDescription className="text-sm">
            KI-basierte Korrekturvorschläge für erkannte Probleme
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {issues
            .filter(i => i.suggested_value !== undefined)
            .map((issue, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`w-4 h-4 ${issue.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <span className="font-medium text-sm">{issue.field}</span>
                      <Badge variant={issue.severity === 'error' ? 'destructive' : 'default'} className="text-xs">
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{issue.message}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded mb-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-slate-600">Aktueller Wert</Label>
                      <div className="font-medium text-red-700">
                        {submission.form_data[issue.field] || '(leer)'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Vorgeschlagener Wert</Label>
                      <div className="font-medium text-green-700">
                        {issue.suggested_value}
                      </div>
                    </div>
                  </div>
                </div>

                {issue.reasoning && (
                  <Alert className="mb-3 bg-blue-50 border-blue-200">
                    <AlertDescription className="text-xs">
                      💡 {issue.reasoning}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  {corrections[issue.field] === issue.suggested_value ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Korrektur ausgewählt
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCorrect(issue)}
                      className="text-xs"
                    >
                      Korrektur übernehmen
                    </Button>
                  )}
                  
                  {corrections[issue.field] !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newCorrections = { ...corrections };
                        delete newCorrections[issue.field];
                        setCorrections(newCorrections);
                      }}
                      className="text-xs"
                    >
                      Zurücksetzen
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {issues.filter(i => i.suggested_value !== undefined).length === 0 && (
          <Alert>
            <AlertDescription>
              Keine automatischen Korrekturvorschläge verfügbar
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || Object.keys(corrections).length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {Object.keys(corrections).length} Korrekturen speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}