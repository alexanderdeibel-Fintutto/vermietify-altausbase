import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfModal } from '@/components/shared/VfModal';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.UserProblem.create({
      description: feedback,
      category: 'feedback',
      severity: 'low'
    }),
    onSuccess: () => {
      showSuccess('Feedback gesendet');
      setFeedback('');
      setOpen(false);
    }
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquare className="h-4 w-4 mr-2" />
        Feedback
      </Button>

      <VfModal
        open={open}
        onOpenChange={setOpen}
        title="Ihr Feedback"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button variant="gradient" onClick={() => submitMutation.mutate()}>
              Senden
            </Button>
          </>
        }
      >
        <VfTextarea
          placeholder="Teilen Sie uns Ihre Meinung mit..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={6}
        />
      </VfModal>
    </>
  );
}