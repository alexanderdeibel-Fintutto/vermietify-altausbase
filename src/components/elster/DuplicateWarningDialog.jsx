import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DuplicateWarningDialog({ 
  open, 
  onOpenChange, 
  duplicateInfo, 
  onContinue 
}) {
  if (!duplicateInfo || !duplicateInfo.has_duplicate) return null;

  const isCritical = duplicateInfo.warning_level === 'critical';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={isCritical ? 'text-red-600' : 'text-yellow-600'} />
            {isCritical ? 'Kritische Warnung' : 'Duplikat gefunden'}
          </DialogTitle>
        </DialogHeader>

        <Alert className={isCritical ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
          <FileText className={`h-4 w-4 ${isCritical ? 'text-red-600' : 'text-yellow-600'}`} />
          <AlertDescription className={isCritical ? 'text-red-900' : 'text-yellow-900'}>
            <p className="font-medium mb-2">{duplicateInfo.message}</p>
            
            {duplicateInfo.latest_submission && (
              <div className="mt-3 p-3 bg-white rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Existierende Submission</span>
                  <Badge variant={isCritical ? 'destructive' : 'default'}>
                    {duplicateInfo.latest_submission.status}
                  </Badge>
                </div>
                <div className="text-xs space-y-1">
                  <div>Erstellt: {format(new Date(duplicateInfo.latest_submission.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                  {duplicateInfo.latest_submission.submission_date && (
                    <div>Übermittelt: {format(new Date(duplicateInfo.latest_submission.submission_date), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                  )}
                </div>
              </div>
            )}

            {isCritical && (
              <p className="text-xs mt-3 text-red-700 font-medium">
                ⚠️ Eine erneute Übermittlung kann zu Doppelmeldungen beim Finanzamt führen!
              </p>
            )}
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => {
              onContinue();
              onOpenChange(false);
            }}
            className={isCritical ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Trotzdem fortfahren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}