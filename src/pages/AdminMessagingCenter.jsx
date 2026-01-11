import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, Archive, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMessagingCenter() {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['tenantMessages'],
    queryFn: () => base44.entities.TenantMessage.list('-updated_date', 200),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ messageId, response }) => {
      await base44.entities.TenantMessage.update(messageId, {
        response,
        response_date: new Date().toISOString(),
        status: 'resolved',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMessages'] });
      setReplyText('');
      setSelectedMessage(null);
      toast.success('Antwort versendet');
    },
  });

  const openMessages = messages.filter(m => m.status === 'open');
  const inProgressMessages = messages.filter(m => m.status === 'in_progress');
  const resolvedMessages = messages.filter(m => m.status === 'resolved');

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
  };

  const filteredMessages = messages.filter(m =>
    getTenantName(m.tenant_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Mieter-Nachrichtenmanagement</h1>
        <p className="text-slate-600 font-light mt-2">Anfragen beantworten und Kommunikation verwalten</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Offen</p>
            <p className="text-2xl font-semibold text-yellow-600 mt-1">{openMessages.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">In Bearbeitung</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">{inProgressMessages.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Beantwortet</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">{resolvedMessages.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Nach Mieter oder Thema suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">Offen ({openMessages.length})</TabsTrigger>
          <TabsTrigger value="progress">In Bearbeitung ({inProgressMessages.length})</TabsTrigger>
          <TabsTrigger value="resolved">Beantwortet ({resolvedMessages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6 space-y-3">
          {openMessages.filter(m => getTenantName(m.tenant_id).toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                Keine offenen Nachrichten
              </CardContent>
            </Card>
          ) : (
            openMessages.map(msg => (
              <Card key={msg.id} className={selectedMessage?.id === msg.id ? 'border-blue-500 border-2' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <h3 className="font-medium text-slate-900">{msg.subject}</h3>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{getTenantName(msg.tenant_id)}</p>
                      <p className="text-sm text-slate-700 mb-2">{msg.message}</p>
                      <p className="text-xs text-slate-500">{new Date(msg.created_date).toLocaleString('de-DE')}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedMessage(msg)}>
                      Antwort
                    </Button>
                  </div>
                  
                  {selectedMessage?.id === msg.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <textarea
                        placeholder="Antwort eingeben..."
                        className="w-full p-2 border rounded text-sm"
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <Button
                        onClick={() => replyMutation.mutate({ messageId: msg.id, response: replyText })}
                        disabled={!replyText.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Antwort senden
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6 space-y-3">
          {inProgressMessages.map(msg => (
            <Card key={msg.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{msg.subject}</h3>
                    <p className="text-sm text-slate-600 mt-1">{getTenantName(msg.tenant_id)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">In Bearbeitung</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="resolved" className="mt-6 space-y-3">
          {resolvedMessages.map(msg => (
            <Card key={msg.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <h3 className="font-medium text-slate-900">{msg.subject}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{getTenantName(msg.tenant_id)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}