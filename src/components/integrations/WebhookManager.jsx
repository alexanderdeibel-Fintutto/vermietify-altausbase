import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Webhook, Plus, Trash2 } from 'lucide-react';

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: '' });

  const addWebhook = () => {
    if (newWebhook.url && newWebhook.event) {
      setWebhooks([...webhooks, { ...newWebhook, id: Date.now() }]);
      setNewWebhook({ url: '', event: '' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <VfInput
              placeholder="Webhook URL"
              value={newWebhook.url}
              onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
            />
            <VfInput
              placeholder="Event (z.B. payment.created)"
              value={newWebhook.event}
              onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })}
            />
          </div>

          <Button variant="outline" onClick={addWebhook} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Webhook hinzufügen
          </Button>

          {webhooks.length > 0 && (
            <div className="space-y-2 mt-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{webhook.event}</div>
                    <div className="text-xs text-[var(--theme-text-muted)]">{webhook.url}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setWebhooks(webhooks.filter(w => w.id !== webhook.id))}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--vf-error-500)]" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}