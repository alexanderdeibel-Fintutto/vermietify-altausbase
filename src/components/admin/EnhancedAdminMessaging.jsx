import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, Paperclip, Search, Filter, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

const priorityColors = {
  low: 'bg-slate-100 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const categoryLabels = {
  payment: 'Zahlung',
  maintenance: 'Wartung',
  contract: 'Vertrag',
  complaint: 'Beschwerde',
  general: 'Allgemein'
};

export default function EnhancedAdminMessaging() {
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('open');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: threads = [] } = useQuery({
    queryKey: ['all-message-threads'],
    queryFn: () => base44.entities.MessageThread.list('-last_message_at', 100),
    refetchInterval: 5000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-thread-messages', selectedThread?.id],
    queryFn: async () => {
      const msgs = await base44.entities.TenantMessage.filter({ 
        thread_id: selectedThread.id 
      });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!selectedThread,
    refetchInterval: 3000
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const replyMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('replyToTenantThread', {
        thread_id: selectedThread.id,
        message: replyText,
        attachments: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-thread-messages']);
      queryClient.invalidateQueries(['all-message-threads']);
      setReplyText('');
      toast.success('Antwort gesendet');
    }
  });

  const updateThreadMutation = useMutation({
    mutationFn: async ({ threadId, updates }) => {
      await base44.entities.MessageThread.update(threadId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-message-threads']);
      toast.success('Thread aktualisiert');
    }
  });

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = searchQuery === '' || 
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || thread.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || thread.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
  };

  const unreadCount = threads.reduce((sum, t) => sum + (t.unread_count_admin || 0), 0);
  const urgentCount = threads.filter(t => t.priority === 'urgent' && t.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mieter-Kommunikation</h1>
            <p className="text-slate-600">Echtzeit-Chat mit Mietern</p>
          </div>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <Badge className="bg-blue-500">{unreadCount} ungelesen</Badge>
          )}
          {urgentCount > 0 && (
            <Badge className="bg-red-500">{urgentCount} dringend</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        {/* Threads List */}
        <Card className="flex flex-col">
          <CardHeader className="border-b">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Prioritäten</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="low">Niedrig</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="open">Offen</SelectItem>
                    <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                    <SelectItem value="resolved">Gelöst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {filteredThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedThread?.id === thread.id 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{thread.subject}</p>
                      <p className="text-xs text-slate-600 truncate">
                        {getTenantName(thread.tenant_id)}
                      </p>
                    </div>
                    {thread.unread_count_admin > 0 && (
                      <Badge className="bg-blue-500 ml-2">{thread.unread_count_admin}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge className={`text-xs ${priorityColors[thread.priority]}`}>
                      {thread.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[thread.category]}
                    </Badge>
                  </div>
                  {thread.ai_summary && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{thread.ai_summary}</p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{selectedThread.subject}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {getTenantName(selectedThread.tenant_id)}
                    </p>
                  </div>
                  <Select
                    value={selectedThread.status}
                    onValueChange={(status) => updateThreadMutation.mutate({
                      threadId: selectedThread.id,
                      updates: { status }
                    })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Offen</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="resolved">Gelöst</SelectItem>
                      <SelectItem value="closed">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'to_tenant' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.direction === 'to_tenant'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {msg.sender_name || (msg.direction === 'to_tenant' ? 'Hausverwaltung' : 'Mieter')}
                      </p>
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
                        msg.direction === 'to_tenant' ? 'text-green-100' : 'text-slate-600'
                      }`}>
                        {new Date(msg.created_date).toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {msg.is_read && msg.direction === 'to_tenant' && (
                          <CheckCheck className="w-3 h-3 ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              <CardContent className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Antwort schreiben..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (replyText.trim()) {
                          replyMutation.mutate();
                        }
                      }
                    }}
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={() => replyMutation.mutate()}
                    disabled={!replyText.trim() || replyMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Wählen Sie eine Unterhaltung</p>
                <p className="text-sm text-slate-500 mt-2">
                  {unreadCount > 0 && `${unreadCount} ungelesene Nachrichten`}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}