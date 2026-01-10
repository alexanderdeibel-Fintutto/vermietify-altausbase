import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function BroadcastMessage({ buildingId }) {
  const [message, setMessage] = useState('');

  const sendMutation = useMutation({
    mutationFn: async (text) => {
      const tenants = await base44.entities.Tenant.list(null, 200);
      
      for (const tenant of tenants) {
        await base44.entities.TenantMessage.create({
          tenant_id: tenant.id,
          tenant_email: tenant.email,
          message: text,
          direction: 'to_tenant',
          building_id: buildingId
        });
      }
      
      return { sent: tenants.length };
    },
    onSuccess: (data) => {
      toast.success(`Nachricht an ${data.sent} Mieter gesendet`);
      setMessage('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Rundnachricht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Nachricht an alle Mieter..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <Button
          onClick={() => sendMutation.mutate(message)}
          disabled={!message || sendMutation.isPending}
          className="w-full bg-orange-600"
        >
          <Send className="w-4 h-4 mr-2" />
          An alle senden
        </Button>
      </CardContent>
    </Card>
  );
}