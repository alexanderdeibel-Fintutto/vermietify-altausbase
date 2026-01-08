import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BatchStatusUpdateDialog({ submissionIds, open, onOpenChange, onSuccess }) {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!newStatus) {
      toast.error('Bitte Status auswählen');
      return;
    }

    setUpdating(true);
    try {
      const response = await base44.functions.invoke('batchUpdateSubmissionStatus', {
        submission_ids: submissionIds,
        new_status: newStatus,
        reason
      });

      if (response.data.success) {
        toast.success(`${response.data.success_count} Submissions aktualisiert`);
        if (response.data.fail_count > 0) {
          toast.warning(`${response.data.fail_count} Fehler`);
        }
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Batch-Update fehlgeschlagen');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batch Status-Update</DialogTitle>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {submissionIds.length} Submissions werden aktualisiert
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label>Neuer Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Entwurf</SelectItem>
                <SelectItem value="AI_PROCESSED">KI-Verarbeitet</SelectItem>
                <SelectItem value="VALIDATED">Validiert</SelectItem>
                <SelectItem value="SUBMITTED">Übermittelt</SelectItem>
                <SelectItem value="ACCEPTED">Akzeptiert</SelectItem>
                <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                <SelectItem value="ARCHIVED">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Grund (optional)</Label>
            <Textarea
              placeholder="Z.B. 'Korrektur nach Prüfung'"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating || !newStatus}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Aktualisieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}