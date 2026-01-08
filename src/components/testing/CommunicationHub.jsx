import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CommunicationHub() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    message_type: 'question',
    recipient_id: ''
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['tester-communications'],
    queryFn: () => base44.entities.TesterCommunication.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => {
      const threadId = data.thread_id || `thread_${Date.now()}`;
      return base44.entities.TesterCommunication.create({
        ...data,
        thread_id: threadId,
        sender_id: user.id,
        sender_role: user.role === 'admin' ? 'programmer' : 'tester',
        is_read: false,
        requires_action: data.message_type === 'question'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-communications'] });
      toast.success('Nachricht gesendet! 📨');
      setShowDialog(false);
      setFormData({
        subject: '',
        message: '',
        message_type: 'question',
        recipient_id: ''
      });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.TesterCommunication.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-communications'] });
    }
  });

  const getMessageTypeIcon = (type) => {
    const icons = {
      question: <HelpCircle className="w-4 h-4 text-blue-600" />,
      clarification: <AlertCircle className="w-4 h-4 text-orange-600" />,
      status_update: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      change_request: <AlertCircle className="w-4 h-4 text-red-600" />,
      approval: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    };
    return icons[type] || icons.question;
  };

  const groupedByThread = communications.reduce((acc, comm) => {
    if (!acc[comm.thread_id]) {
      acc[comm.thread_id] = [];
    }
    acc[comm.thread_id].push(comm);
    return acc;
  }, {});

  const threads = Object.entries(groupedByThread).map(([threadId, messages]) => ({
    threadId,
    messages: messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
    lastMessage: messages[messages.length - 1],
    unreadCount: messages.filter(m => !m.is_read && m.recipient_id === user?.id).length
  })).sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Kommunikation</h2>
          <p className="text-sm text-slate-600">Bidirektionale Kommunikation zwischen Testern und Programmierern</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Send className="w-4 h-4" />
          Neue Nachricht
        </Button>
      </div>

      <div className="grid gap-4">
        {threads.map((thread, idx) => {
          const lastMsg = thread.lastMessage;
          const sender = users.find(u => u.id === lastMsg.sender_id);
          
          return (
            <motion.div
              key={thread.threadId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  thread.unreadCount > 0 ? 'border-2 border-blue-400' : ''
                }`}
                onClick={() => {
                  setSelectedThread(thread);
                  thread.messages.forEach(msg => {
                    if (!msg.is_read && msg.recipient_id === user?.id) {
                      markAsReadMutation.mutate(msg.id);
                    }
                  });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{sender?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{lastMsg.subject}</span>
                          {thread.unreadCount > 0 && (
                            <Badge className="bg-blue-600">{thread.unreadCount} neu</Badge>
                          )}
                        </div>
                        {getMessageTypeIcon(lastMsg.message_type)}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{lastMsg.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>{sender?.full_name || sender?.email}</span>
                        <span>•</span>
                        <span>{new Date(lastMsg.created_date).toLocaleDateString('de-DE')}</span>
                        <span>•</span>
                        <span>{thread.messages.length} Nachricht(en)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Nachricht</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Empfänger *</Label>
              <Select 
                value={formData.recipient_id} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, recipient_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Empfänger wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id !== user?.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nachrichtentyp</Label>
              <Select 
                value={formData.message_type} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, message_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">❓ Frage</SelectItem>
                  <SelectItem value="clarification">💡 Klarstellung</SelectItem>
                  <SelectItem value="status_update">📊 Status-Update</SelectItem>
                  <SelectItem value="change_request">🔄 Änderungswunsch</SelectItem>
                  <SelectItem value="approval">✅ Freigabe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Betreff *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Betreff der Nachricht..."
              />
            </div>

            <div>
              <Label>Nachricht *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Ihre Nachricht..."
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => sendMessageMutation.mutate(formData)}
                disabled={!formData.subject || !formData.message || !formData.recipient_id || sendMessageMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <Send className="w-4 h-4" />
                Senden
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedThread && (
        <Dialog open={!!selectedThread} onOpenChange={() => setSelectedThread(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedThread.lastMessage.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedThread.messages.map((msg, idx) => {
                const msgSender = users.find(u => u.id === msg.sender_id);
                const isOwnMessage = msg.sender_id === user?.id;
                
                return (
                  <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isOwnMessage ? 'bg-emerald-100' : 'bg-slate-100'} rounded-lg p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {msgSender?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{msgSender?.full_name || msgSender?.email}</span>
                        <Badge variant="outline" className="text-xs">{msg.sender_role}</Badge>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      <div className="text-xs text-slate-500 mt-2">
                        {new Date(msg.created_date).toLocaleString('de-DE')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}