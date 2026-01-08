import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Share2, Loader2, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ShareWithAdvisorDialog({ submission, open, onOpenChange }) {
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleShare = async () => {
    if (!advisorEmail) {
      toast.error('Bitte E-Mail-Adresse eingeben');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('shareWithTaxAdvisor', {
        submission_id: submission.id,
        advisor_email: advisorEmail,
        advisor_name: advisorName,
        message
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onOpenChange(false);
        setAdvisorEmail('');
        setAdvisorName('');
        setMessage('');
      }
    } catch (error) {
      toast.error('Freigabe fehlgeschlagen');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mit Steuerberater teilen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Das Formular wird als PDF per E-Mail an Ihren Steuerberater gesendet.
            </AlertDescription>
          </Alert>

          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">Formular:</span>
              <span className="font-medium">{submission.tax_form_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Jahr:</span>
              <span className="font-medium">{submission.tax_year}</span>
            </div>
          </div>

          <div>
            <Label>E-Mail-Adresse des Steuerberaters *</Label>
            <Input
              type="email"
              value={advisorEmail}
              onChange={(e) => setAdvisorEmail(e.target.value)}
              placeholder="steuerberater@beispiel.de"
            />
          </div>

          <div>
            <Label>Name des Steuerberaters (optional)</Label>
            <Input
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>

          <div>
            <Label>Nachricht (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Zusätzliche Informationen für Ihren Steuerberater..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleShare}
              disabled={sending || !advisorEmail}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              Senden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}