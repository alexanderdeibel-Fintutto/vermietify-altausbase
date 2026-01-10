import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PenTool, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ESignaturePanel() {
  const queryClient = useQueryClient();

  const { data: pending = [] } = useQuery({
    queryKey: ['pendingSignatures'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPendingSignatures', {});
      return response.data.signatures;
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (documentId) => {
      await base44.functions.invoke('requestESignature', { document_id: documentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSignatures'] });
      toast.success('Signaturanfrage versendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          E-Signatur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.map(sig => (
          <div key={sig.id} className="p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-sm">{sig.document_name}</p>
            <p className="text-xs text-slate-600">Unterzeichner: {sig.signer_email}</p>
            <Badge className="mt-2" variant="outline">{sig.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}