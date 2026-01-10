import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, Paperclip, User, Building2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantCommunicationHub() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [attachments, setAttachments] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', user?.email],
    queryFn: async () => {
      const tenants = await base44.entities.Tenant.filter({ email: user.email });
      return tenants[0];
    },
    enabled: !!user
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['tenant-messages', tenant?.id],
    queryFn: async () => {
      const msgs = await base44.entities.TenantMessage.filter({ 
        tenant_id: tenant.id 
      });
      return msgs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!tenant,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendTenantMessageToManager', {
        tenant_id: tenant.id,
        subject,
        message,
        attachments
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-messages']);
      setMessage('');
      setSubject('');
      setAttachments([]);
      toast.success('Nachricht gesendet');
    },
    onError: () => {
      toast.error('Fehler beim Senden der Nachricht');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      await base44.entities.TenantMessage.update(messageId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-messages']);
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadPromises = files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return { name: file.name, url: file_url };
    });
    const uploaded = await Promise.all(uploadPromises);
    setAttachments([...attachments, ...uploaded]);
  };

  const unreadCount = messages.filter(m => !m.is_read && m.direction === 'to_tenant').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Kommunikation</h2>
            <p className="text-slate-600">Nachrichten an Ihre Hausverwaltung</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500">{unreadCount} ungelesen</Badge>
        )}
      </div>

      {/* New Message Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Neue Nachricht senden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Betreff</label>
            <Input
              placeholder="Worum geht es?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Nachricht</label>
            <Textarea
              placeholder="Schreiben Sie Ihre Nachricht..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
          {attachments.length > 0 && (
            <div className="space-y-1">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                  <Paperclip className="w-3 h-3" />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => sendMessageMutation.mutate()}
              disabled={!message || !subject || sendMessageMutation.isPending}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMessageMutation.isPending ? 'Wird gesendet...' : 'Senden'}
            </Button>
            <label>
              <Button variant="outline" asChild>
                <div>
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nachrichtenverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-slate-600 py-4">Lade Nachrichten...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Noch keine Nachrichten</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg border ${
                    msg.direction === 'from_tenant'
                      ? 'bg-blue-50 border-blue-200 ml-8'
                      : 'bg-white border-slate-200 mr-8'
                  } ${!msg.is_read && msg.direction === 'to_tenant' ? 'border-blue-400 border-2' : ''}`}
                  onClick={() => {
                    if (!msg.is_read && msg.direction === 'to_tenant') {
                      markAsReadMutation.mutate(msg.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.direction === 'from_tenant' ? 'bg-blue-600' : 'bg-slate-600'
                      }`}>
                        {msg.direction === 'from_tenant' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Building2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {msg.direction === 'from_tenant' ? 'Sie' : 'Hausverwaltung'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.created_date).toLocaleString('de-DE')}
                        </div>
                      </div>
                    </div>
                    {!msg.is_read && msg.direction === 'to_tenant' && (
                      <Badge className="bg-blue-500">Neu</Badge>
                    )}
                  </div>
                  <p className="text-slate-800 whitespace-pre-wrap">{msg.message}</p>
                  {msg.attachments?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {msg.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          Anhang {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}