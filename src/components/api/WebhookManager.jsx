import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Webhook, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function WebhookManager() {
  const [url, setUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getWebhooks', {});
      return response.data.webhooks;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('createWebhook', { url, events: ['transaction.created'] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook erstellt');
      setUrl('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="w-5 h-5" />
          Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button size="icon" onClick={() => createMutation.mutate()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {webhooks.map(wh => (
          <div key={wh.id} className="p-2 bg-slate-50 rounded">
            <p className="font-mono text-xs">{wh.url}</p>
            <Badge className="mt-1 text-xs bg-green-600">Aktiv</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}