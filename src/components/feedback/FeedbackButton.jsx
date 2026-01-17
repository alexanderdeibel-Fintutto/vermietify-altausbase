import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfModal } from '@/components/shared/VfModal';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { VfRadio } from '@/components/shared/VfRadio';
import { MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await base44.analytics.track({
        eventName: 'feedback_submitted',
        properties: {
          type: data.type,
          message: data.message
        }
      });
    },
    onSuccess: () => {
      showSuccess('Feedback gesendet', 'Vielen Dank für Ihr Feedback!');
      setMessage('');
      setOpen(false);
    }
  });

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Feedback
      </Button>

      <VfModal
        open={open}
        onOpenChange={setOpen}
        title="Feedback geben"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="gradient"
              onClick={() => submitMutation.mutate({ type, message })}
              disabled={!message}
            >
              Absenden
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <VfRadio
            label="Art des Feedbacks"
            value={type}
            onValueChange={setType}
            options={[
              { value: 'suggestion', label: 'Verbesserungsvorschlag' },
              { value: 'bug', label: 'Problem melden' },
              { value: 'praise', label: 'Lob' },
              { value: 'question', label: 'Frage' }
            ]}
          />

          <VfTextarea
            label="Ihre Nachricht"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Beschreiben Sie Ihr Anliegen..."
          />
        </div>
      </VfModal>
    </>
  );
}