import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Scale, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LegalTextUpdates() {
  const queryClient = useQueryClient();

  const { data: updates = [] } = useQuery({
    queryKey: ['legalUpdates'],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkLegalTextUpdates', {});
      return response.data.updates;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (updateId) => {
      await base44.functions.invoke('applyLegalUpdate', { update_id: updateId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legalUpdates'] });
      toast.success('Rechtstext aktualisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Rechtstexte-Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {updates.map(upd => (
          <div key={upd.id} className="p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-sm">{upd.title}</p>
            <p className="text-xs text-slate-600 mt-1">{upd.description}</p>
            <Button size="sm" className="mt-2" onClick={() => applyMutation.mutate(upd.id)}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Anwenden
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}