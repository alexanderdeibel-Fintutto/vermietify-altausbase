import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TransferApprovalPanel() {
  const [selectedId, setSelectedId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current_user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingTransfers = [], isLoading } = useQuery({
    queryKey: ['pending_transfers'],
    queryFn: () => base44.entities.TransferDraft.filter({ status: 'EINGEREICHT' }),
    enabled: user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('approveTransfer', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_transfers'] });
      setSelectedId(null);
      setRejectionReason('');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitTransferToFinAPI', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_transfers'] });
      setSelectedId(null);
    },
  });

  if (user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return <Card><CardContent className="p-8 text-center text-slate-600">Wird geladen...</CardContent></Card>;
  }

  if (!pendingTransfers || pendingTransfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Überweisungs-Genehmigungen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Keine ausstehenden Genehmigungen</p>
        </CardContent>
      </Card>
    );
  }

  const selected = pendingTransfers.find(t => t.id === selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Überweisungs-Genehmigungen</span>
          <Badge className="bg-red-100 text-red-800">{pendingTransfers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedId ? (
          <div className="space-y-2">
            {pendingTransfers.map((transfer) => (
              <div
                key={transfer.id}
                onClick={() => setSelectedId(transfer.id)}
                className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{transfer.recipient_name}</p>
                    <p className="text-sm text-slate-600">{transfer.purpose}</p>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    {transfer.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-500">{transfer.transfer_type}</p>
                  <Badge variant="outline">GENEHMIGUNG ERFORDERLICH</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Sie genehmigen eine Überweisung von {selected.amount}€ an {selected.recipient_name}
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 p-4 rounded space-y-2 border border-slate-200">
              <div>
                <Label className="text-xs text-slate-600">Empfänger</Label>
                <p className="font-medium">{selected.recipient_name}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-600">IBAN</Label>
                <p className="font-mono text-sm">{selected.recipient_iban}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Betrag</Label>
                <p className="font-bold text-lg">{selected.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Zweck</Label>
                <p className="text-sm">{selected.purpose}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection_reason" className="text-xs">
                Ablehnungsgrund (optional)
              </Label>
              <Input
                id="rejection_reason"
                placeholder="Falls Sie ablehnen möchten..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedId(null);
                  setRejectionReason('');
                }}
              >
                Zurück
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  approveMutation.mutate({
                    transfer_draft_id: selectedId,
                    approved: false,
                    rejection_reason: rejectionReason,
                  })
                }
                disabled={approveMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Ablehnen
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() =>
                  approveMutation.mutate({
                    transfer_draft_id: selectedId,
                    approved: true,
                  })
                }
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Genehmigen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}