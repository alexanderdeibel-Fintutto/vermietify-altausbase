import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ApprovalWorkflowManager() {
  const queryClient = useQueryClient();

  const { data: approvals = [] } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPendingApprovals', {});
      return response.data.approvals;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }) => {
      await base44.functions.invoke('processApproval', { approval_id: id, approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      toast.success('Genehmigung verarbeitet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Genehmigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {approvals.map(app => (
          <div key={app.id} className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-sm">{app.title}</p>
            <p className="text-xs text-slate-600">{app.description}</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={() => approveMutation.mutate({ id: app.id, approved: true })}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Genehmigen
              </Button>
              <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ id: app.id, approved: false })}>
                <XCircle className="w-4 h-4 mr-1" />
                Ablehnen
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}