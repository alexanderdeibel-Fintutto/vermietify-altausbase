import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Plus, Send, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function CommunicationHub() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipient_id: '',
    message_type: 'question'
  });

  const queryClient = useQueryClient();

  const { data: communications = [] } = useQuery({
    queryKey: ['tester-communications'],
    queryFn: () => base44.asServiceRole.entities.TesterCommunication.list('-created_date', 100)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const threadId = Date.now().toString();
      return base44.asServiceRole.entities.TesterCommunication.create({
        thread_id: threadId,
        sender_id: currentUser.id,
        sender_role: 'programmer',
        recipient_id: data.recipient_id,
        message_type: data.message_type,
        subject: data.subject,
        message: data.message,
        is_read: false,
        requires_action: data.message_type !== 'status_update'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-communications'] });
      toast.success('Nachricht gesendet!');
      resetForm();
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

  const resetForm = () => {
    setFormData({
      subject: '',
      message: '',
      recipient_id: '',
      message_type: 'question'
    });
    setDialogOpen(false);
  };

  // Gruppiere Nachrichten nach Thread
  const threads = communications.reduce((acc, comm) => {
    if (!acc[comm.thread_id]) {
      acc[comm.thread_id] = [];
    }
    acc[comm.thread_id].push(comm);
    return acc;
  }, {});

  const testers = users.filter(u => u.is_tester);

  const messageTypeConfig = {
    question: { label: 'Frage', color: 'bg-blue-100 text-blue-800' },
    clarification: { label: 'Klärung', color: 'bg-purple-100 text-purple-800' },
    status_update: { label: 'Status', color: 'bg-green-100 text-green-800' },
    change_request: { label: 'Änderung', color: 'bg-orange-100 text-orange-800' },
    approval: { label: 'Freigabe', color: 'bg-emerald-100 text-emerald-800' }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Kommunikation</h3>
          <p className="text-sm text-slate-600">Nachrichten zwischen Programmierern und Testern</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Neue Nachricht
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neue Nachricht senden</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Empfänger (Tester) *</Label>
                <Select value={formData.recipient_id} onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tester wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {testers.map(tester => (
                      <SelectItem key={tester.id} value={tester.id}>
                        {tester.full_name || tester.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nachrichtentyp</Label>
                <Select value={formData.message_type} onValueChange={(value) => setFormData({ ...formData, message_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">Frage</SelectItem>
                    <SelectItem value="clarification">Klärungsbedarf</SelectItem>
                    <SelectItem value="status_update">Status-Update</SelectItem>
                    <SelectItem value="change_request">Änderungsanfrage</SelectItem>
                    <SelectItem value="approval">Freigabe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Betreff *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Betreff der Nachricht"
                />
              </div>
              <div>
                <Label>Nachricht *</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Deine Nachricht..."
                  rows={5}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.recipient_id || !formData.subject || !formData.message}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Nachricht senden
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {Object.entries(threads).map(([threadId, messages]) => {
          const latestMessage = messages[0];
          const sender = users.find(u => u.id === latestMessage.sender_id);
          const recipient = users.find(u => u.id === latestMessage.recipient_id);
          const unreadCount = messages.filter(m => !m.is_read && m.recipient_id === currentUser?.id).length;
          const typeConfig = messageTypeConfig[latestMessage.message_type];

          return (
            <Card key={threadId} className={!latestMessage.is_read && latestMessage.recipient_id === currentUser?.id ? 'border-2 border-indigo-300' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar>
                      <AvatarFallback>{sender?.full_name?.charAt(0) || 'T'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">{latestMessage.subject}</div>
                        <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                        {latestMessage.requires_action && <Badge variant="outline">Aktion erforderlich</Badge>}
                        {unreadCount > 0 && <Badge className="bg-indigo-600">{unreadCount} neu</Badge>}
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        Von: <span className="font-medium">{sender?.full_name || sender?.email}</span>
                        {' → '}
                        An: <span className="font-medium">{recipient?.full_name || recipient?.email}</span>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">{latestMessage.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <div>{format(new Date(latestMessage.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                        <div>{messages.length} Nachricht{messages.length > 1 ? 'en' : ''}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!latestMessage.is_read && latestMessage.recipient_id === currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(latestMessage.id)}
                      >
                        <Bell className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {communications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Noch keine Kommunikation vorhanden</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}