import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, FileText, Plus } from 'lucide-react';

export default function DuplicateWarningDialog({ open, onOpenChange, duplicates, onContinue, onEditExisting }) {
  if (!duplicates || duplicates.length === 0) return null;

  const acceptedSubmission = duplicates.find(d => d.status === 'ACCEPTED');
  const activeSubmissions = duplicates.filter(d => 
    d.status !== 'ARCHIVED' && d.status !== 'REJECTED'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Existierende Submissions gefunden
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              Für dieses Gebäude und Jahr existieren bereits {duplicates.length} Submission(s).
            </AlertDescription>
          </Alert>

          {acceptedSubmission && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Eine Submission wurde bereits von ELSTER akzeptiert.
                Eine neue Submission sollte nur für Korrekturen erstellt werden.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium">Gefundene Submissions:</div>
            {duplicates.map((dup) => (
              <div key={dup.id} className="p-3 border rounded hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">
                        Submission {dup.id.slice(0, 8)}
                      </span>
                      <Badge variant={dup.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                        {dup.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>Erstellt: {new Date(dup.created_date).toLocaleDateString('de-DE')}</div>
                      {dup.submission_date && (
                        <div>Eingereicht: {new Date(dup.submission_date).toLocaleDateString('de-DE')}</div>
                      )}
                      {dup.ai_confidence_score && (
                        <div>KI-Vertrauen: {dup.ai_confidence_score}%</div>
                      )}
                    </div>
                  </div>
                  {activeSubmissions.includes(dup) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditExisting?.(dup.id)}
                    >
                      Bearbeiten
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Trotzdem neue erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}