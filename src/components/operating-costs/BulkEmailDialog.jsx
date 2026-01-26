import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkEmailDialog({ statementId, onClose, onSuccess }) {
  const [emailBody, setEmailBody] = useState('');
  const [sendCopies, setSendCopies] = useState(false);
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('sendOperatingCostEmail', {
        statementId,
        sendToAll: true,
        customMessage: emailBody || undefined
      });
    },
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success(`${response.data.sent} Emails erfolgreich versendet`);
        queryClient.invalidateQueries({ queryKey: ['operatingCostStatements'] });
        onSuccess?.();
      }
    },
    onError: (error) => {
      toast.error('Versand fehlgeschlagen: ' + error.message);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Abrechnungen versenden</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Zusätzliche Nachricht (optional)</Label>
            <Textarea
              placeholder="Diese Nachricht wird an alle Mieter gesendet..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox 
              checked={sendCopies}
              onCheckedChange={setSendCopies}
            />
            <Label>Kopien an mich senden</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="bg-blue-900"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird versendet...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Jetzt versenden
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}