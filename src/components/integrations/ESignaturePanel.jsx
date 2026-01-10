import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PenTool, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ESignaturePanel() {
  const { data: pending = [] } = useQuery({
    queryKey: ['pendingSignatures'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPendingSignatures', {});
      return response.data.signatures;
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (docId) => {
      await base44.functions.invoke('requestESignature', { document_id: docId });
    },
    onSuccess: () => {
      toast.success('Signaturanfrage gesendet');
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
      <CardContent className="space-y-3">
        {pending.map(sig => (
          <div key={sig.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{sig.document_name}</p>
              <p className="text-xs text-slate-600">{sig.signer_email}</p>
            </div>
            <Badge className={sig.signed ? 'bg-green-600' : 'bg-orange-600'}>
              {sig.signed ? 'Signiert' : 'Ausstehend'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}