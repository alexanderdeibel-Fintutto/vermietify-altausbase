import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TransferInitiationDialog({
  open,
  onOpenChange,
  bankAccountId,
  transferType = 'SONSTIGE_UEBERWEISUNG',
  referenceId = null,
  referenceType = null,
}) {
  const [step, setStep] = useState(1); // 1: Form, 2: TAN, 3: Approval
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_iban: '',
    recipient_bic: '',
    amount: '',
    purpose: '',
  });
  const [tan, setTan] = useState('');
  const [transferDraftId, setTransferDraftId] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current_user'],
    queryFn: () => base44.auth.me(),
    enabled: open,
  });

  const initiateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('initiateTransfer', data),
    onSuccess: (response) => {
      setTransferDraftId(response.data.transferDraftId);
      setStep(2);
      setError(null);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Fehler beim Erstellen der Überweisung');
    },
  });

  const verifyTANMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('verifyTransferTAN', data),
    onSuccess: (response) => {
      if (response.data.status === 'EINGEREICHT') {
        setStep(3);
      } else {
        setStep(4);
      }
      setError(null);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'TAN-Verifizierung fehlgeschlagen');
    },
  });

  const handleInitiate = (e) => {
    e.preventDefault();
    if (!formData.recipient_name || !formData.recipient_iban || !formData.amount) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    initiateMutation.mutate({
      bank_account_id: bankAccountId,
      transfer_type: transferType,
      recipient_name: formData.recipient_name,
      recipient_iban: formData.recipient_iban.replace(/\s/g, ''),
      recipient_bic: formData.recipient_bic || null,
      amount: parseFloat(formData.amount),
      purpose: formData.purpose,
      reference_id: referenceId,
      reference_type: referenceType,
    });
  };

  const handleVerifyTAN = (e) => {
    e.preventDefault();
    if (!tan || tan.length !== 6) {
      setError('Bitte geben Sie eine 6-stellige TAN ein');
      return;
    }

    verifyTANMutation.mutate({
      transfer_draft_id: transferDraftId,
      tan_value: tan,
    });
  };

  const handleCancel = () => {
    setStep(1);
    setFormData({ recipient_name: '', recipient_iban: '', recipient_bic: '', amount: '', purpose: '' });
    setTan('');
    setTransferDraftId(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Überweisung initiieren</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Schritt 1: Formular */}
        {step === 1 && (
          <form onSubmit={handleInitiate} className="space-y-4">
            <div>
              <Label htmlFor="recipient_name">Empfänger Name *</Label>
              <Input
                id="recipient_name"
                placeholder="z.B. Max Mustermann"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="recipient_iban">IBAN *</Label>
              <Input
                id="recipient_iban"
                placeholder="z.B. DE89370400440532013000"
                value={formData.recipient_iban}
                onChange={(e) => setFormData({ ...formData, recipient_iban: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <Label htmlFor="recipient_bic">BIC (optional)</Label>
              <Input
                id="recipient_bic"
                placeholder="z.B. COBADEFF"
                value={formData.recipient_bic}
                onChange={(e) => setFormData({ ...formData, recipient_bic: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <Label htmlFor="amount">Betrag (EUR) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="z.B. 500.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="purpose">Verwendungszweck *</Label>
              <Input
                id="purpose"
                placeholder="z.B. Kautionsrückzahlung"
                maxLength="140"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              />
              <p className="text-xs text-slate-600 mt-1">{formData.purpose.length}/140</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={initiateMutation.isPending}>
                {initiateMutation.isPending ? 'Wird erstellt...' : 'Weiter'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Schritt 2: TAN-Eingabe */}
        {step === 2 && (
          <form onSubmit={handleVerifyTAN} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-sm text-blue-900">
                Überweisung von <span className="font-bold">{formData.amount} EUR</span> an <span className="font-bold">{formData.recipient_name}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="tan">TAN (6 Ziffern) *</Label>
              <Input
                id="tan"
                type="password"
                placeholder="000000"
                maxLength="6"
                inputMode="numeric"
                value={tan}
                onChange={(e) => setTan(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-xs text-slate-600 mt-1">
                Bitte geben Sie die TAN ein, die Sie erhalten haben
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Zurück
              </Button>
              <Button type="submit" disabled={verifyTANMutation.isPending}>
                {verifyTANMutation.isPending ? 'Wird verifiziert...' : 'TAN verifizieren'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Schritt 3: Genehmigung erforderlich */}
        {step === 3 && (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Überweisung wartet auf Genehmigung durch einen Admin
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 p-4 rounded space-y-2">
              <p className="text-sm">
                <span className="text-slate-600">Empfänger:</span> <span className="font-bold">{formData.recipient_name}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-600">Betrag:</span> <span className="font-bold">{formData.amount} EUR</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-600">Zweck:</span> <span className="font-bold">{formData.purpose}</span>
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleCancel}>
                Schließen
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Schritt 4: Erfolgreich */}
        {step === 4 && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Überweisung erfolgreich versendet
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 p-4 rounded space-y-2">
              <p className="text-sm text-slate-600">
                Tracking-Nummer: <span className="font-mono">{transferDraftId?.substring(0, 8)}</span>
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleCancel}>
                Schließen
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}