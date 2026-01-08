import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ShareWithAdvisorDialog({ submission, open, onOpenChange }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!email) {
      toast.error('Bitte E-Mail-Adresse eingeben');
      return;
    }

    setSharing(true);
    try {
      const response = await base44.functions.invoke('shareWithTaxAdvisor', {
        submission_id: submission.id,
        advisor_email: email,
        message
      });

      if (response.data.success) {
        toast.success(`Erfolgreich an ${email} gesendet`);
        onOpenChange(false);
        setEmail('');
        setMessage('');
      }
    } catch (error) {
      toast.error('Freigabe fehlgeschlagen');
      console.error(error);
    } finally {
      setSharing(false);
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Mit Steuerberater teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <div className="font-medium">{submission.tax_form_type}</div>
            <div className="text-slate-600">Steuerjahr {submission.tax_year}</div>
          </div>

          <div>
            <Label>E-Mail des Steuerberaters *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="steuerberater@beispiel.de"
            />
          </div>

          <div>
            <Label>Nachricht (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Fügen Sie eine persönliche Nachricht hinzu..."
              rows={4}
            />
          </div>

          <div className="text-xs text-slate-600">
            Der Steuerberater erhält per E-Mail einen Link zum PDF und Zugriff auf die Submission-Daten.
          </div>

          <div className="flex gap-2">
            <Button onClick={handleShare} disabled={sharing} className="flex-1">
              {sharing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              Freigeben
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}