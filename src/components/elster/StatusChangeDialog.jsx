import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function StatusChangeDialog({ submission, targetStatus, open, onOpenChange, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const statusTransitions = {
    VALIDATED: {
      title: 'Submission validieren',
      description: 'Die Submission wird als validiert markiert und kann übermittelt werden.',
      requiresReason: false,
      confirmText: 'Validieren'
    },
    SUBMITTED: {
      title: 'An ELSTER übermitteln',
      description: 'Die Submission wird an das ELSTER-System übermittelt. Stellen Sie sicher, dass alle Daten korrekt sind.',
      requiresReason: false,
      confirmText: 'Übermitteln',
      warning: 'Diese Aktion sendet die Daten an das Finanzamt!'
    },
    ARCHIVED: {
      title: 'GoBD-Archivierung',
      description: 'Die Submission wird gemäß GoBD-Vorgaben archiviert und ist 10 Jahre aufbewahrungspflichtig.',
      requiresReason: false,
      confirmText: 'Archivieren'
    },
    REJECTED: {
      title: 'Als abgelehnt markieren',
      description: 'Markieren Sie diese Submission als abgelehnt.',
      requiresReason: true,
      confirmText: 'Ablehnen'
    }
  };

  const config = statusTransitions[targetStatus];
  if (!config || !submission) return null;

  const handleConfirm = async () => {
    if (config.requiresReason && !reason.trim()) {
      toast.error('Bitte geben Sie einen Grund an');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.ElsterSubmission.update(submission.id, {
        status: targetStatus,
        ...(reason && { status_change_reason: reason })
      });

      toast.success(`Status auf ${targetStatus} geändert`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Statusänderung fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            {config.description}
          </div>

          {config.warning && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                {config.warning}
              </AlertDescription>
            </Alert>
          )}

          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">Formular:</span>
              <span className="font-medium">{submission.tax_form_type}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">Jahr:</span>
              <span className="font-medium">{submission.tax_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Aktueller Status:</span>
              <span className="font-medium">{submission.status}</span>
            </div>
          </div>

          {config.requiresReason && (
            <div>
              <Label>Grund für die Statusänderung</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Bitte geben Sie einen Grund an..."
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {config.confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}