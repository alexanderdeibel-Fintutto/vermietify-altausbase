import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ApprovalQueue() {
  const [comment, setComment] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Approval?.list?.('-submitted_at', 50) || [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Approval?.update?.(id, {
        status: 'approved',
        decided_at: new Date().toISOString(),
        approver_comment: comment
      });
    },
    onSuccess: () => {
      toast.success('✅ Genehmigt');
      queryClient.invalidateQueries(['approvals']);
      setComment('');
      setSelectedId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Approval?.update?.(id, {
        status: 'rejected',
        decided_at: new Date().toISOString(),
        approver_comment: comment
      });
    },
    onSuccess: () => {
      toast.success('✅ Abgelehnt');
      queryClient.invalidateQueries(['approvals']);
      setComment('');
      setSelectedId(null);
    }
  });

  const pending = approvals.filter(a => a.status === 'pending');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Genehmigungswarteschlange</h3>
        <Badge>{pending.length} ausstehend</Badge>
      </div>

      <div className="space-y-2">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">Keine ausstehenden Genehmigungen</p>
        ) : (
          pending.map(approval => (
            <Card key={approval.id}>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{approval.request_title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{approval.entity_type}</Badge>
                        <span className="text-xs text-slate-500">{approval.requester_email}</span>
                      </div>
                    </div>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>

                  {selectedId === approval.id && (
                    <div className="pt-2 border-t space-y-2">
                      <Textarea
                        placeholder="Kommentar (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="h-20 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(approval.id)}
                          className="flex-1 gap-1 bg-green-600"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Genehmigen
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(approval.id)}
                          className="flex-1 gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedId !== approval.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedId(approval.id)}
                      className="w-full text-xs"
                    >
                      Details anzeigen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}