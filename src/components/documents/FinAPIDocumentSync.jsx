import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Link2 } from 'lucide-react';

export default function FinAPIDocumentSync({ companyId }) {
  const [selectedAccount, setSelectedAccount] = useState('');
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['finapi-accounts', companyId],
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('finapiAccountSync', {
          company_id: companyId
        });
        return result.data?.accounts || [];
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        return [];
      }
    }
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('finapiDocumentImport', {
        company_id: companyId,
        account_id: selectedAccount
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  if (isLoading) return <div className="text-center py-8">Lade FinAPI-Konten...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          FinAPI Dokumenten-Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium">Konto auswählen</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full mt-1 p-2 border rounded text-sm"
          >
            <option value="">-- Wähle ein Konto --</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName} ({acc.number})
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => syncMutation.mutate()}
          disabled={!selectedAccount || syncMutation.isPending}
          className="w-full gap-2"
        >
          {syncMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Transaktionen importieren
        </Button>

        {accounts.length > 0 && (
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
            {accounts.length} Konto(n) verbunden
          </div>
        )}
      </CardContent>
    </Card>
  );
}