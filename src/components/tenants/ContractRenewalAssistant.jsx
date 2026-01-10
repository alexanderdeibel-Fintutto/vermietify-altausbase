import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractRenewalAssistant() {
  const queryClient = useQueryClient();

  const { data: expiring = [] } = useQuery({
    queryKey: ['expiringContracts'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getExpiringContracts', {});
      return response.data.contracts;
    }
  });

  const renewMutation = useMutation({
    mutationFn: async (contractId) => {
      await base44.functions.invoke('initiateContractRenewal', { contract_id: contractId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiringContracts'] });
      toast.success('Verlängerungsangebot versendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Vertragsverlängerung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {expiring.map(contract => (
          <div key={contract.id} className="p-3 bg-orange-50 rounded-lg">
            <p className="font-semibold text-sm">{contract.tenant_name}</p>
            <p className="text-xs text-slate-600">Läuft aus: {contract.end_date}</p>
            <Button size="sm" className="mt-2" onClick={() => renewMutation.mutate(contract.id)}>
              <Send className="w-4 h-4 mr-1" />
              Verlängerung anbieten
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}