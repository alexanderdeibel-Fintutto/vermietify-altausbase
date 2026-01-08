import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PaymentReminderDialog({ open, onOpenChange, payment, tenant }) {
  const [reminderType, setReminderType] = useState('email');
  const [message, setMessage] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list(),
    enabled: open
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('sendPaymentReminder', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Zahlungserinnerung versendet');
      onOpenChange(false);
      setMessage('');
    }
  });

  const reminderTemplates = templates.filter(t => t.category === 'tenant' && t.is_active);

  const handleSend = () => {
    if (!payment || !tenant) return;

    sendReminderMutation.mutate({
      paymentId: payment.id,
      tenantId: tenant.id,
      reminderType,
      message: message || generateDefaultMessage(),
      tenant_email: tenant.email,
      tenant_name: tenant.full_name
    });
  };

  const generateDefaultMessage = () => {
    if (!payment || !tenant) return '';
    
    const dueDate = payment.due_date ? format(parseISO(payment.due_date), 'dd.MM.yyyy', { locale: de }) : 'N/A';
    const amount = (payment.expected_amount || payment.amount || 0).toLocaleString('de-DE');
    
    return `Sehr geehrte/r ${tenant.full_name},

hiermit möchten wir Sie daran erinnern, dass die folgende Zahlung noch aussteht:

Beschreibung: ${payment.description}
Betrag: ${amount} €
Fälligkeitsdatum: ${dueDate}

Bitte überweisen Sie den ausstehenden Betrag innerhalb der nächsten 7 Tage.

Mit freundlichen Grüßen`;
  };

  if (!payment || !tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Zahlungserinnerung senden</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Mieter:</span>
                <div className="font-medium">{tenant.full_name}</div>
              </div>
              <div>
                <span className="text-slate-600">E-Mail:</span>
                <div className="font-medium">{tenant.email}</div>
              </div>
              <div>
                <span className="text-slate-600">Betrag:</span>
                <div className="font-medium">
                  {(payment.expected_amount || payment.amount || 0).toLocaleString('de-DE')} €
                </div>
              </div>
              <div>
                <span className="text-slate-600">Fällig:</span>
                <div className="font-medium">
                  {payment.due_date ? format(parseISO(payment.due_date), 'dd.MM.yyyy', { locale: de }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Versandart</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={reminderType === 'email' ? 'default' : 'outline'}
                onClick={() => setReminderType('email')}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                E-Mail
              </Button>
              <Button
                variant={reminderType === 'whatsapp' ? 'default' : 'outline'}
                onClick={() => setReminderType('whatsapp')}
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant={reminderType === 'letter' ? 'default' : 'outline'}
                onClick={() => setReminderType('letter')}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Brief
              </Button>
            </div>
          </div>

          {reminderType === 'email' && reminderTemplates.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Vorlage auswählen</label>
              <Select onValueChange={(val) => {
                const template = templates.find(t => t.id === val);
                if (template) setMessage(template.body);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Vorlage wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {reminderTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Nachricht</label>
            <Textarea
              value={message || generateDefaultMessage()}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">Automatische Dokumentation</Badge>
            <Badge variant="outline">Tracking aktiviert</Badge>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendReminderMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Senden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}