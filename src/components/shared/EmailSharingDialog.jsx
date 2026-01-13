import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmailSharingDialog({ open, onOpenChange, document, documentUrl }) {
  const [recipients, setRecipients] = useState(['']);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRemoveRecipient = (idx) => {
    setRecipients(recipients.filter((_, i) => i !== idx));
  };

  const handleUpdateRecipient = (idx, value) => {
    const updated = [...recipients];
    updated[idx] = value;
    setRecipients(updated);
  };

  const handleSend = async () => {
    const validRecipients = recipients.filter(r => r.trim());
    
    if (validRecipients.length === 0) {
      toast.error('Bitte mindestens 1 E-Mail-Adresse eingeben');
      return;
    }

    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: validRecipients.join(','),
        subject: `Dokument geteilt: ${document?.name || 'Dokument'}`,
        body: `
Hallo,

das folgende Dokument wurde mit dir geteilt:

${document?.name || 'Dokument'}

Nachricht: ${message || '(Keine Nachricht)'}

Link: ${documentUrl}

Freundliche Grüße
        `
      });

      toast.success(`✅ Dokument an ${validRecipients.length} Empfänger versendet`);
      handleReset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Fehler beim Versenden');
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setRecipients(['']);
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Dokument teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Info */}
          {document && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">Dokument:</p>
              <p className="font-medium text-sm truncate">{document.name}</p>
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="text-sm font-medium">Empfänger</label>
            <div className="space-y-2 mt-2">
              {recipients.map((recipient, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="E-Mail-Adresse"
                    value={recipient}
                    onChange={(e) => handleUpdateRecipient(idx, e.target.value)}
                  />
                  {recipients.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveRecipient(idx)}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddRecipient}
              className="mt-2"
            >
              + Empfänger
            </Button>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium">Nachricht (optional)</label>
            <Textarea
              placeholder="z.B. 'Bitte überprüfen und unterschreiben'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 h-24"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !recipients.some(r => r.trim())}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Versende...' : 'Teilen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}