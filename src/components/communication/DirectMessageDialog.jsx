import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function DirectMessageDialog({ onClose, userEmail }) {
  const [recipientType, setRecipientType] = useState('admin');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: admins = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const users = await base44.entities.User.list(null, 200);
      return users.filter(u => u.role === 'admin');
    }
  });

  const { data: buildingManagers = [] } = useQuery({
    queryKey: ['buildingManagers'],
    queryFn: () => base44.entities.BuildingManager.filter({ is_active: true }, null, 100)
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TenantMessage.create({
        sender_email: userEmail,
        sender_type: 'tenant',
        recipient_email: data.recipientEmail,
        message_text: `${data.subject}\n\n${data.message}`,
        is_read: false,
        created_at: new Date().toISOString()
      });

      // Also create notification for recipient
      await base44.entities.Notification.create({
        user_email: data.recipientEmail,
        title: `Neue Nachricht: ${data.subject}`,
        message: data.message.substring(0, 100),
        type: 'message',
        priority: 'normal',
        is_read: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMessages'] });
      toast.success('Nachricht gesendet');
      onClose();
    }
  });

  const handleSend = () => {
    if (!recipientEmail || !subject || !message) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    sendMutation.mutate({ recipientEmail, subject, message });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Neue Nachricht</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Empfängertyp</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Gebäudemanager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Empfänger</Label>
            <Select value={recipientEmail} onValueChange={setRecipientEmail}>
              <SelectTrigger>
                <SelectValue placeholder="Empfänger auswählen" />
              </SelectTrigger>
              <SelectContent>
                {recipientType === 'admin' ? (
                  admins.map(admin => (
                    <SelectItem key={admin.id} value={admin.email}>
                      {admin.full_name} ({admin.email})
                    </SelectItem>
                  ))
                ) : (
                  buildingManagers.map(manager => (
                    <SelectItem key={manager.id} value={manager.user_email}>
                      {manager.full_name} - {manager.role}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Betreff</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff der Nachricht"
            />
          </div>

          <div>
            <Label>Nachricht</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ihre Nachricht..."
              rows={8}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSend} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={sendMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMutation.isPending ? 'Wird gesendet...' : 'Nachricht senden'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}