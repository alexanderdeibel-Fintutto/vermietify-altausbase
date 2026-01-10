import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

export default function CreateVersionDialog({ workflowId, companyId, currentVersion, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: currentVersion?.name || '',
    description: currentVersion?.description || '',
    change_notes: '',
    activate: false
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createWorkflowVersion', {
        workflow_id: workflowId,
        company_id: companyId,
        name: formData.name,
        description: formData.description,
        trigger: currentVersion?.trigger || {},
        steps: currentVersion?.steps || [],
        change_notes: formData.change_notes,
        activate: formData.activate
      }),
    onSuccess: () => {
      onSuccess();
    }
  });

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Workflow-Version erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Version des aktuellen Workflows
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Workflow-Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Workflow-Name"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optionale Beschreibung"
              className="mt-1 h-20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Änderungsnotizen</label>
            <Textarea
              value={formData.change_notes}
              onChange={(e) => setFormData({ ...formData, change_notes: e.target.value })}
              placeholder="Was wurde in dieser Version geändert?"
              className="mt-1 h-24"
            />
          </div>

          {/* Warning if activating */}
          {formData.activate && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Diese Version wird aktiviert. Laufende Instanzen müssen separat verwaltet werden.
                </p>
              </CardContent>
            </Card>
          )}

          <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
            <Checkbox
              checked={formData.activate}
              onCheckedChange={(checked) => setFormData({ ...formData, activate: checked })}
            />
            <span className="text-sm text-slate-700">
              Diese Version sofort aktivieren
            </span>
          </label>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!formData.name || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Erstellt...' : 'Version erstellen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}