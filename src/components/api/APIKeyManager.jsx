import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Key, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function APIKeyManager() {
  const queryClient = useQueryClient();

  const { data: keys = [] } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAPIKeys', {});
      return response.data.keys;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createAPIKey', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success(`API Key erstellt: ${data.key}`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Keys
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => createMutation.mutate()} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Neuen API Key erstellen
        </Button>
        {keys.map(key => (
          <div key={key.id} className="p-3 bg-slate-50 rounded-lg">
            <p className="font-mono text-xs">{key.key}</p>
            <Badge variant="outline" className="mt-1">Erstellt: {key.created_at}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}