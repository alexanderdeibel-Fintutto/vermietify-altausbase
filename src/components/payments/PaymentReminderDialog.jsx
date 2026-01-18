import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function PaymentReminderDialog({ open, onClose, payment }) {
  const [template, setTemplate] = useState('friendly');
  const [customMessage, setCustomMessage] = useState('');

  const templates = {
    friendly: 'Guten Tag,\n\nwir möchten Sie freundlich daran erinnern, dass die Zahlung für die Miete noch aussteht.',
    formal: 'Sehr geehrte/r Mieter/in,\n\nhiermit erinnern wir Sie an die ausstehende Mietzahlung.',
    urgent: 'Dringend: Die Mietzahlung ist nun 14 Tage überfällig.'
  };

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Zahlungserinnerung senden"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button variant="gradient">
            <Send className="h-4 w-4 mr-2" />
            Senden
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfSelect
          label="Vorlage"
          value={template}
          onChange={setTemplate}
          options={[
            { value: 'friendly', label: 'Freundlich' },
            { value: 'formal', label: 'Formal' },
            { value: 'urgent', label: 'Dringend' }
          ]}
        />

        <VfTextarea
          label="Nachricht"
          value={customMessage || templates[template]}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={6}
        />
      </div>
    </VfModal>
  );
}