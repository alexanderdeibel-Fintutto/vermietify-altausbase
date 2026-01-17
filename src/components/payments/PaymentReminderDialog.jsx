import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function PaymentReminderDialog({ open, onClose, payment }) {
  const sendMutation = useMutation({
    mutationFn: () => base44.functions.invoke('sendPaymentReminder', { 
      payment_id: payment.id 
    }),
    onSuccess: () => {
      showSuccess('Zahlungserinnerung gesendet');
      onClose();
    }
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Zahlungserinnerung senden"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Erinnerung senden
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p>
          Möchten Sie eine Zahlungserinnerung an <strong>{payment?.tenant_name}</strong> senden?
        </p>
        <div className="p-4 bg-[var(--theme-surface)] rounded-lg">
          <div className="text-sm mb-2">
            <span className="text-[var(--theme-text-muted)]">Betrag:</span> €{payment?.amount}
          </div>
          <div className="text-sm">
            <span className="text-[var(--theme-text-muted)]">Fällig am:</span>{' '}
            {payment?.due_date ? new Date(payment.due_date).toLocaleDateString('de-DE') : '-'}
          </div>
        </div>
      </div>
    </VfModal>
  );
}