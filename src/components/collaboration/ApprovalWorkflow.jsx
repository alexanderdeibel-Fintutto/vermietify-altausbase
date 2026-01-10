import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ApprovalWorkflow() {
  const queryClient = useQueryClient();

  const { data: pending = [] } = useQuery({
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
      <CardContent className="space-y-3">
        {pending.map(item => (
          <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">{item.title}</p>
              <Badge className="bg-orange-600">{item.amount}€</Badge>
            </div>
            <p className="text-xs text-slate-600 mb-3">{item.description}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => approveMutation.mutate({ id: item.id, approved: true })} className="bg-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Genehmigen
              </Button>
              <Button size="sm" variant="destructive" onClick={() => approveMutation.mutate({ id: item.id, approved: false })}>
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