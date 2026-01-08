import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

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
        toast.success(`${response.data.results.updated} Submissions aktualisiert`);
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Update fehlgeschlagen');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Status für {submissionIds.length} Submissions ändern</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Neuer Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="AI_PROCESSED">AI Processed</SelectItem>
                <SelectItem value="VALIDATED">Validated</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Grund (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Warum wird der Status geändert?"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleUpdate} disabled={updating || !newStatus} className="flex-1">
              {updating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Aktualisieren
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}