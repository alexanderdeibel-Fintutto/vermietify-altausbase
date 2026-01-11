import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Loader2 } from 'lucide-react';

export default function EncryptionManager({ documentId, companyId }) {
  const [password, setPassword] = useState('');
  const queryClient = useQueryClient();

  const { data: encryption } = useQuery({
    queryKey: ['encryption', documentId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DocumentEncryption.filter({
        document_id: documentId,
        is_encrypted: true
      });
      return result[0] || null;
    }
  });

  const encryptMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('encryptDocument', {
        document_id: documentId,
        company_id: companyId,
        password,
        action: 'encrypt'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encryption', 'document'] });
      setPassword('');
    }
  });

  const decryptMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('encryptDocument', {
        document_id: documentId,
        password,
        action: 'decrypt'
      })
  });

  const isEncrypted = !!encryption;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {isEncrypted ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4" />}
          End-to-End Verschlüsselung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEncrypted && (
          <div className="bg-red-50 p-3 rounded">
            <p className="text-sm font-medium text-red-900">Verschlüsselt</p>
            <p className="text-xs text-red-700">Methode: {encryption.encryption_method}</p>
          </div>
        )}

        <Input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-sm"
        />

        <div className="flex gap-2">
          <Button
            onClick={() => encryptMutation.mutate()}
            disabled={!password || encryptMutation.isPending || isEncrypted}
            className="flex-1 gap-2"
          >
            {encryptMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Lock className="w-3 h-3" />
            Verschlüsseln
          </Button>

          <Button
            onClick={() => decryptMutation.mutate()}
            disabled={!password || decryptMutation.isPending || !isEncrypted}
            variant="outline"
            className="flex-1 gap-2"
          >
            {decryptMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Unlock className="w-3 h-3" />
            Entschlüsseln
          </Button>
        </div>

        {decryptMutation.isSuccess && (
          <div className="bg-slate-50 p-3 rounded max-h-40 overflow-y-auto">
            <p className="text-xs font-mono">{decryptMutation.data?.data?.content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}