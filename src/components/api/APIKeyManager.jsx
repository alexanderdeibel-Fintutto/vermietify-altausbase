import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Key, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function APIKeyManager() {
  const [keyName, setKeyName] = useState('');
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
      const response = await base44.functions.invoke('createAPIKey', { name: keyName });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      navigator.clipboard.writeText(data.key);
      toast.success('API-Key erstellt und kopiert');
      setKeyName('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API-Schlüssel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input 
            placeholder="Schlüsselname" 
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
          <Button size="icon" onClick={() => createMutation.mutate()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {keys.map(key => (
            <div key={key.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <div>
                <p className="text-sm font-semibold">{key.name}</p>
                <p className="text-xs text-slate-600">{key.key.substring(0, 20)}...</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => {
                navigator.clipboard.writeText(key.key);
                toast.success('Kopiert');
              }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}