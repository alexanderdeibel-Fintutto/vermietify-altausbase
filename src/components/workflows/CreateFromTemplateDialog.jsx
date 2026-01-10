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
import { Card, CardContent } from '@/components/ui/card';

export default function CreateFromTemplateDialog({ template, companyId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    workflow_name: `${template.name} (Kopie)`,
    workflow_description: template.description || ''
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createWorkflowFromTemplate', {
        company_id: companyId,
        template_id: template.id,
        workflow_name: formData.workflow_name,
        workflow_description: formData.workflow_description
      }),
    onSuccess: () => {
      onSuccess();
    }
  });

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Workflow aus Template erstellen</DialogTitle>
          <DialogDescription>
            Basierend auf: <span className="font-medium">{template.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <Card className="bg-slate-50">
            <CardContent className="pt-3">
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-slate-600">Kategorie</p>
                  <p className="font-medium text-slate-900">{template.category}</p>
                </div>
                {template.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600">Tags</p>
                    <p className="font-medium text-slate-900">{template.tags.join(', ')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <div>
            <label className="text-sm font-medium text-slate-700">Workflow-Name</label>
            <Input
              value={formData.workflow_name}
              onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Beschreibung</label>
            <Textarea
              value={formData.workflow_description}
              onChange={(e) => setFormData({ ...formData, workflow_description: e.target.value })}
              className="mt-1 h-20"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!formData.workflow_name || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Erstellt...' : 'Workflow erstellen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}