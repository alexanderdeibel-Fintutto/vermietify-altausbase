import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Copy, Trash } from 'lucide-react';
import { toast } from 'sonner';

export default function DuplicateDetector() {
  const queryClient = useQueryClient();

  const { data: duplicates = [] } = useQuery({
    queryKey: ['duplicates'],
    queryFn: async () => {
      const response = await base44.functions.invoke('detectDuplicates', {});
      return response.data.duplicates;
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (ids) => {
      await base44.functions.invoke('removeDuplicates', { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
      toast.success('Duplikate entfernt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="w-5 h-5" />
          Duplikat-Erkennung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {duplicates.map(dup => (
          <div key={dup.group_id} className="p-3 bg-orange-50 rounded-lg">
            <p className="font-semibold text-sm">{dup.items.length} mögliche Duplikate</p>
            <p className="text-xs text-slate-600">{dup.items[0]?.name}</p>
            <Button size="sm" className="mt-2" onClick={() => removeMutation.mutate(dup.item_ids)}>
              <Trash className="w-4 h-4 mr-1" />
              Duplikate entfernen
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}