import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function FinAPIBankingSync() {
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['finAPIAccounts'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFinAPIAccounts', {});
      return response.data.accounts;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('syncFinAPITransactions', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finAPIAccounts'] });
      toast.success('Banking-Daten synchronisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Banking-Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map(acc => (
          <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{acc.name}</p>
              <p className="text-xs text-slate-600">{acc.iban}</p>
            </div>
            <Badge className="bg-green-600">{acc.balance}€</Badge>
          </div>
        ))}
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          {syncMutation.isPending ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
        </Button>
      </CardContent>
    </Card>
  );
}