import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Plus, Trash2, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const EVENT_TYPES = [
  'invoice.created',
  'invoice.paid',
  'contract.signed',
  'payment.received',
  'document.uploaded'
];

export default function WebhookManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [url, setUrl] = useState('');
  const [eventType, setEventType] = useState('invoice.created');
  const queryClient = useQueryClient();

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.Webhook?.list?.('-updated_date', 50) || []
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const secret = 'whsec_' + Math.random().toString(36).substr(2, 32);
      await base44.entities.Webhook?.create?.({
        url: url,
        event_type: eventType,
        secret: secret
      });
    },
    onSuccess: () => {
      toast.success('✅ Webhook erstellt');
      queryClient.invalidateQueries(['webhooks']);
      setUrl('');
      setEventType('invoice.created');
      setShowDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (webhookId) => {
      await base44.entities.Webhook?.delete?.(webhookId);
    },
    onSuccess: () => {
      toast.success('✅ Webhook gelöscht');
      queryClient.invalidateQueries(['webhooks']);
    }
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Webhooks</h3>
        <Button
          size="sm"
          onClick={() => setShowDialog(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Webhook hinzufügen
        </Button>
      </div>

      {/* Webhooks List */}
      <div className="space-y-2">
        {webhooks.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Webhooks konfiguriert</p>
        ) : (
          webhooks.map(webhook => (
            <Card key={webhook.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium font-mono text-xs truncate">{webhook.url}</p>
                    <Badge className="mt-1">{webhook.event_type}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {webhook.failure_count > 0 ? (
                      <AlertCircle className="w-5 h-5 text-red-600" title={`${webhook.failure_count} failures`} />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                </div>

                {webhook.last_triggered && (
                  <p className="text-xs text-slate-500">
                    Zuletzt: {new Date(webhook.last_triggered).toLocaleString('de-DE')}
                  </p>
                )}

                <div className="flex gap-1 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(webhook.secret);
                      toast.success('📋 Secret kopiert');
                    }}
                  >
                    <Copy className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(webhook.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <Input
                placeholder="https://example.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Event</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(event => (
                    <SelectItem key={event} value={event}>{event}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!url || createMutation.isPending}
              >
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}