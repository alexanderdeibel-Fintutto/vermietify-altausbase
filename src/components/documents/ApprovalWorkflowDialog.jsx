import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ApprovalWorkflowDialog({ open, onOpenChange, documentId, versionId }) {
  const [approverEmail, setApproverEmail] = useState('');
  const queryClient = useQueryClient();

  const createWorkflowMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return await base44.asServiceRole.entities.ApprovalWorkflow.create({
        document_id: documentId,
        document_version_id: versionId,
        approver_email: approverEmail,
        requester_email: user.email,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      toast.success(`Genehmigung angefordert von ${approverEmail}`);
      setApproverEmail('');
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Genehmigung anfordern</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Genehmiger Email</Label>
            <Input 
              type="email"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
              placeholder="genehmiger@example.com"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => createWorkflowMutation.mutate()}
              disabled={!approverEmail || createWorkflowMutation.isPending}
            >
              Anfordern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}