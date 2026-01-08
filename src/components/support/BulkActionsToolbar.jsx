import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckSquare, Trash2, UserPlus, RotateCcw, Github } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkActionsToolbar({ selectedIds, onActionComplete }) {
  const [action, setAction] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error('Keine Probleme ausgewählt');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        problem_ids: selectedIds,
        action: action
      };

      if (action === 'assign' && assignTo) {
        payload.updates = { assigned_to: assignTo };
      } else if (action === 'update_status' && newStatus) {
        payload.updates = { status: newStatus };
      }

      const response = await base44.functions.invoke('bulkUpdateProblems', payload);

      if (response.data.success) {
        toast.success(`${response.data.successful} Probleme erfolgreich bearbeitet`);
        if (response.data.failed > 0) {
          toast.warning(`${response.data.failed} Probleme fehlgeschlagen`);
        }
        onActionComplete();
      }
    } catch (error) {
      toast.error('Bulk-Aktion fehlgeschlagen');
      console.error(error);
    } finally {
      setIsProcessing(false);
      setConfirmOpen(false);
    }
  };

  const createGitHubIssues = async () => {
    setIsProcessing(true);
    let created = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        await base44.functions.invoke('createGitHubIssue', { problem_id: id });
        created++;
      } catch (error) {
        failed++;
      }
    }

    toast.success(`${created} GitHub Issues erstellt${failed > 0 ? `, ${failed} fehlgeschlagen` : ''}`);
    setIsProcessing(false);
    onActionComplete();
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="font-medium text-blue-900">
        {selectedIds.length} ausgewählt
      </span>

      <div className="flex-1 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction('update_status');
            setConfirmOpen(true);
          }}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Status ändern
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction('assign');
            setConfirmOpen(true);
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Zuweisen
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction('recalculate_priority');
            handleBulkAction();
          }}
          disabled={isProcessing}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Priorität neu berechnen
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={createGitHubIssues}
          disabled={isProcessing}
        >
          <Github className="w-4 h-4 mr-2" />
          GitHub Issues erstellen
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAction('close');
            handleBulkAction();
          }}
          disabled={isProcessing}
        >
          Schließen
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm(`${selectedIds.length} Probleme wirklich löschen?`)) {
              setAction('delete');
              handleBulkAction();
            }
          }}
          disabled={isProcessing}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Löschen
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk-Aktion: {action}</DialogTitle>
          </DialogHeader>

          {action === 'update_status' && (
            <div>
              <label className="block mb-2 font-medium">Neuer Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="resolved">Gelöst</SelectItem>
                  <SelectItem value="wont_fix">Won't Fix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'assign' && (
            <div>
              <label className="block mb-2 font-medium">Zuweisen an (Email)</label>
              <input
                type="email"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="developer@example.com"
              />
            </div>
          )}

          <Button onClick={handleBulkAction} disabled={isProcessing} className="w-full">
            {isProcessing ? 'Wird bearbeitet...' : `${selectedIds.length} Probleme bearbeiten`}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}