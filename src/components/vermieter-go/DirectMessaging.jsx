import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, User } from 'lucide-react';
import { toast } from 'sonner';

export default function DirectMessaging({ buildingId }) {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['tenantMessages'],
    queryFn: () => base44.entities.TenantMessage.filter({}, '-created_date', 50)
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.filter({ status: 'active' }, 'last_name', 100)
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      await base44.functions.invoke('sendTenantMessage', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMessages'] });
      toast.success('Nachricht gesendet');
      setMessage('');
    }
  });

  const quickReplies = [
    '👍 Verstanden, ich kümmere mich darum',
    '📅 Ich schaue heute vorbei',
    '✅ Erledigt',
    '🔧 Handwerker ist informiert'
  ];

  const unreadMessages = messages.filter(m => !m.is_read && m.direction === 'from_tenant');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Nachrichten
            {unreadMessages.length > 0 && (
              <Badge className="bg-red-600">{unreadMessages.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {unreadMessages.map(msg => {
            const tenant = tenants.find(t => t.id === msg.tenant_id);
            return (
              <div key={msg.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {tenant?.first_name} {tenant?.last_name}
                    </p>
                    <p className="text-sm mt-1">{msg.message}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTenant(msg.tenant_id);
                      setMessage('');
                    }}
                  >
                    Antworten
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {selectedTenant && (
        <Card className="border-2 border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-sm">Schnellantwort</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {quickReplies.map((reply, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  onClick={() => setMessage(reply)}
                  className="text-xs h-auto py-2"
                >
                  {reply}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nachricht..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => sendMutation.mutate({
                  tenant_id: selectedTenant,
                  message
                })}
                disabled={!message}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}