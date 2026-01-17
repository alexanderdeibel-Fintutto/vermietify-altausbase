import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Clock } from 'lucide-react';

export default function ReportScheduler({ open, onClose, reportType }) {
  const [frequency, setFrequency] = useState('weekly');
  const [recipients, setRecipients] = useState('');

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ReportSchedule.create({
        report_type: reportType,
        frequency: data.frequency,
        recipients: data.recipients.split(',').map(e => e.trim()),
        is_active: true
      });
    },
    onSuccess: () => onClose()
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Bericht planen"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => scheduleMutation.mutate({ frequency, recipients })}
          >
            <Clock className="h-4 w-4 mr-2" />
            Planen
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfSelect
          label="Häufigkeit"
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: 'Täglich' },
            { value: 'weekly', label: 'Wöchentlich' },
            { value: 'monthly', label: 'Monatlich' }
          ]}
        />

        <VfInput
          label="E-Mail-Empfänger"
          placeholder="email@example.com, email2@example.com"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
        />
      </div>
    </VfModal>
  );
}