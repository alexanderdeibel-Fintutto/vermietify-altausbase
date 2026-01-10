import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building, SwitchCamera } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiMandantManager() {
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
      toast.success('Mandant gewechselt');
      window.location.reload();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Mandanten-Verwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select onValueChange={(v) => switchMutation.mutate(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Mandant wählen" />
          </SelectTrigger>
          <SelectContent>
            {mandants.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}