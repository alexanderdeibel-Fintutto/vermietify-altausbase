import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Webhook, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const EVENTS = [
  { value: 'invoice.created', label: '🧾 Rechnung erstellt' },
  { value: 'invoice.paid', label: '💳 Rechnung bezahlt' },
  { value: 'contract.created', label: '📋 Vertrag erstellt' },
  { value: 'payment.received', label: '💰 Zahlung empfangen' }
];

export default function WebhookManager() {
  const [showNew, setShowNew] = useState(false);
  const [url, setUrl] = useState('');
  const [event, setEvent] = useState('');
  const queryClient = useQueryClient();

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.Webhook?.list?.('-updated_date', 50) || []
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Webhook?.create?.({
        url: url,
        event: event,
        is_active: true,
        last_triggered: null
      });
    },
    onSuccess: () => {
      toast.success('✅ Webhook erstellt');
      queryClient.invalidateQueries(['webhooks']);
      setUrl('');
      setEvent('');
      setShowNew(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Webhook?.delete?.(id),
    onSuccess: () => {
      toast.success('✅ Webhook gelöscht');
      queryClient.invalidateQueries(['webhooks']);
    }
  });

  const testMutation = useMutation({
    mutationFn: async (webhookId) => {
      return base44.functions.invoke('testWebhookAction', { webhookId });
    },
    onSuccess: () => {
      toast.success('✅ Test-Webhook gesendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Webhooks
          </span>
          <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neu
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {webhooks.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Webhooks konfiguriert</p>
        ) : (
          webhooks.map(hook => (
            <div key={hook.id} className="p-3 bg-slate-50 rounded border space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{EVENTS.find(e => e.value === hook.event)?.label}</Badge>
                    {hook.is_active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-mono mt-2 break-all">{hook.url}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testMutation.mutate(hook.id)}
                    disabled={testMutation.isPending}
                  >
                    Test
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(hook.id)}
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {hook.last_triggered && (
                <p className="text-xs text-slate-500">
                  Zuletzt: {new Date(hook.last_triggered).toLocaleString('de-DE')}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>

      {/* Create New Webhook Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Event</label>
              <Select value={event} onValueChange={setEvent}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Event wählen" />
                </SelectTrigger>
                <SelectContent>
                  {EVENTS.map(e => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                type="url"
                placeholder="https://example.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!url || !event || createMutation.isPending}
              >
                {createMutation.isPending ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}