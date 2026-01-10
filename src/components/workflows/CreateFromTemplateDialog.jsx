import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function CreateFromTemplateDialog({
  open,
  onOpenChange,
  template,
  companyId
}) {
  const [workflowName, setWorkflowName] = useState(`${template?.name} - Kopie`);
  const [workflowDescription, setWorkflowDescription] = useState(template?.description || '');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createWorkflowFromTemplate', {
        company_id: companyId,
        template_id: template.id,
        workflow_name: workflowName,
        workflow_description: workflowDescription
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      onOpenChange(false);
      // Navigate to new workflow
      window.location.href = `/workflow/${result.data.workflow.id}`;
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Workflow aus Template erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-medium text-sm">{template?.name}</p>
            <p className="text-xs text-slate-600 mt-1">{template?.description}</p>
            {template?.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Workflow Name */}
          <div>
            <label className="text-sm font-medium">Workflow-Name</label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Workflow Description */}
          <div>
            <label className="text-sm font-medium">Beschreibung</label>
            <Textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="mt-1 h-20"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!workflowName || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Erstellt...
                </>
              ) : (
                'Erstellen'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}