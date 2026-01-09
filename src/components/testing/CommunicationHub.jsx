import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, MessageCircle, Loader2 } from 'lucide-react';

export default function CommunicationHub({ open, onOpenChange, testAccountId, problemReportId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch communication thread
  const { data: communications } = useQuery({
    queryKey: ['testerComm', problemReportId],
    queryFn: async () => {
      if (!problemReportId) return [];
      return base44.entities.TesterCommunication.filter({
        problem_report_id: problemReportId
      }, '-created_date');
    },
    enabled: !!problemReportId && open
  });

  useEffect(() => {
    if (communications) {
      setMessages(communications);
    }
  }, [communications]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const user = await base44.auth.me();

      const message = await base44.asServiceRole.entities.TesterCommunication.create({
        thread_id: `thread_${problemReportId}`,
        problem_report_id: problemReportId,
        sender_id: user.id,
        sender_role: 'tester',
        message_type: 'clarification',
        subject: `Nachricht zu Problem ${problemReportId?.substring(0, 8)}`,
        message: newMessage.trim(),
        is_read: false,
        requires_action: true
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      toast.success('Nachricht gesendet ✅');
      queryClient.invalidateQueries({ queryKey: ['testerComm'] });
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Kommunikation mit Entwickler
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {!messages || messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm font-light text-slate-500 text-center">
                Keine Nachrichten<br/>
                <span className="text-xs">Starte eine Konversation mit dem Entwickler-Team</span>
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender_role === 'tester' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-xs p-3 ${
                    msg.sender_role === 'tester'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="text-sm font-light">{msg.message}</p>
                  <p className={`text-xs ${
                    msg.sender_role === 'tester' ? 'text-blue-100' : 'text-slate-500'
                  } mt-1`}>
                    {new Date(msg.created_date).toLocaleTimeString('de-DE')}
                  </p>
                </Card>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Nachricht tippen..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}