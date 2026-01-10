import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, Paperclip, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedTenantChat() {
  const [selectedThread, setSelectedThread] = useState(null);
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
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

  const { data: threads = [] } = useQuery({
    queryKey: ['message-threads', tenant?.id],
    queryFn: async () => {
      const t = await base44.entities.MessageThread.filter({ tenant_id: tenant.id });
      return t.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    },
    enabled: !!tenant,
    refetchInterval: 5000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['thread-messages', selectedThread?.id],
    queryFn: async () => {
      const msgs = await base44.entities.TenantMessage.filter({ 
        thread_id: selectedThread.id 
      });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!selectedThread,
    refetchInterval: 3000
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedThread && messages.length > 0) {
      const unreadMessages = messages.filter(m => !m.is_read && m.direction === 'to_tenant');
      unreadMessages.forEach(msg => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [selectedThread, messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedThread && !newThreadSubject) {
        throw new Error('Subject required for new thread');
      }

      if (selectedThread) {
        return await base44.functions.invoke('sendRealtimeTenantMessage', {
          tenant_id: tenant.id,
          subject: selectedThread.subject,
          message: messageText,
          attachments
        });
      } else {
        const response = await base44.functions.invoke('sendRealtimeTenantMessage', {
          tenant_id: tenant.id,
          subject: newThreadSubject,
          message: messageText,
          attachments
        });
        return response;
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['message-threads']);
      queryClient.invalidateQueries(['thread-messages']);
      setMessageText('');
      setAttachments([]);
      setNewThreadSubject('');
      
      if (response.data.priority === 'urgent') {
        toast.success('Nachricht mit hoher Priorität gesendet!');
      } else {
        toast.success('Nachricht gesendet');
      }
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      await base44.entities.TenantMessage.update(messageId, {
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user.email
      });
      
      if (selectedThread) {
        await base44.entities.MessageThread.update(selectedThread.id, {
          unread_count_tenant: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['thread-messages']);
      queryClient.invalidateQueries(['message-threads']);
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

  const priorityColors = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Threads List */}
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Unterhaltungen
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setSelectedThread(null);
                setNewThreadSubject('');
              }}
            >
              + Neue Unterhaltung
            </Button>

            {threads.map(thread => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedThread?.id === thread.id 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-sm truncate flex-1">{thread.subject}</p>
                  {thread.unread_count_tenant > 0 && (
                    <Badge className="bg-blue-500 ml-2">{thread.unread_count_tenant}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{thread.category}</Badge>
                  <Badge className={`text-xs ${priorityColors[thread.priority]}`}>
                    {thread.priority}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {new Date(thread.last_message_at).toLocaleDateString('de-DE')}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="lg:col-span-2 flex flex-col">
        {selectedThread || !threads.length || newThreadSubject !== '' ? (
          <>
            <CardHeader className="border-b">
              {selectedThread ? (
                <div>
                  <CardTitle className="text-base">{selectedThread.subject}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={priorityColors[selectedThread.priority]}>
                      {selectedThread.priority}
                    </Badge>
                    <Badge variant="outline">{selectedThread.category}</Badge>
                    <Badge className={selectedThread.status === 'resolved' ? 'bg-green-500' : 'bg-slate-500'}>
                      {selectedThread.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div>
                  <CardTitle className="text-base mb-3">Neue Unterhaltung</CardTitle>
                  <Input
                    placeholder="Betreff eingeben..."
                    value={newThreadSubject}
                    onChange={(e) => setNewThreadSubject(e.target.value)}
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedThread && messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'from_tenant' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.direction === 'from_tenant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs opacity-90 hover:underline"
                          >
                            <Paperclip className="w-3 h-3" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      msg.direction === 'from_tenant' ? 'text-blue-100' : 'text-slate-600'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {new Date(msg.created_date).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {msg.direction === 'from_tenant' && (
                        msg.is_read ? (
                          <CheckCheck className="w-3 h-3 ml-1" />
                        ) : (
                          <Check className="w-3 h-3 ml-1" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            <CardContent className="border-t p-4">
              {attachments.length > 0 && (
                <div className="mb-2 space-y-1">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
                      <Paperclip className="w-3 h-3" />
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Nachricht schreiben..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (messageText.trim() && (selectedThread || newThreadSubject)) {
                        sendMessageMutation.mutate();
                      }
                    }
                  }}
                  rows={3}
                  className="flex-1"
                />
                <div className="flex flex-col gap-2">
                  <label>
                    <Button variant="outline" size="icon" asChild>
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
                  <Button
                    size="icon"
                    onClick={() => sendMessageMutation.mutate()}
                    disabled={!messageText.trim() || (!selectedThread && !newThreadSubject) || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {!selectedThread && !newThreadSubject && (
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Bitte geben Sie einen Betreff ein
                </p>
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Wählen Sie eine Unterhaltung oder starten Sie eine neue</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}