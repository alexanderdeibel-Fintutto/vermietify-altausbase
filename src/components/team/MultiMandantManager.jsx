import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiMandantManager() {
  const queryClient = useQueryClient();

  const { data: mandants = [] } = useQuery({
    queryKey: ['mandants'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMandants', {});
      return response.data.mandants;
    }
  });

  const switchMutation = useMutation({
    mutationFn: async (mandantId) => {
      await base44.functions.invoke('switchMandant', { mandant_id: mandantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Mandant gewechselt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Mandanten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mandants.map(mandant => (
          <div key={mandant.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{mandant.name}</p>
              <Badge variant="outline">{mandant.buildings_count} Gebäude</Badge>
            </div>
            <Button size="sm" onClick={() => switchMutation.mutate(mandant.id)}>
              Wechseln
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}