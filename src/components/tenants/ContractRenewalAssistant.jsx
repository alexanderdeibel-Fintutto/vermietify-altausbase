import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractRenewalAssistant() {
  const { data: contracts = [] } = useQuery({
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
      toast.success('Verlängerung eingeleitet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Vertragsverlängerungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contracts.map(contract => (
          <div key={contract.id} className="p-3 bg-orange-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{contract.tenant_name}</p>
                <p className="text-xs text-slate-600">Läuft aus: {contract.end_date}</p>
                <Badge className="mt-1 bg-orange-600">{contract.days_until} Tage</Badge>
              </div>
              <Button size="sm" onClick={() => renewMutation.mutate(contract.id)}>
                <Send className="w-4 h-4 mr-1" />
                Anbieten
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}