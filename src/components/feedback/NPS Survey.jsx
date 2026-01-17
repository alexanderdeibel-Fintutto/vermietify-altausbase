import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';

export default function NPSSurvey({ onDismiss }) {
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await base44.analytics.track({
        eventName: 'nps_survey_submitted',
        properties: {
          score: data.score,
          feedback: data.feedback
        }
      });
    },
    onSuccess: () => setSubmitted(true)
  });

  if (submitted) {
    return (
      <Card className="border-[var(--vf-success-500)]">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2">Vielen Dank für Ihr Feedback! 🙏</h3>
          <p className="text-sm text-[var(--theme-text-secondary)]">
            Ihre Meinung hilft uns, vermitify besser zu machen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Wie zufrieden sind Sie mit vermitify?</span>
          <button onClick={onDismiss} className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]">
            <X className="h-5 w-5" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--theme-text-muted)]">Nicht zufrieden</span>
            <span className="text-[var(--theme-text-muted)]">Sehr zufrieden</span>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setScore(num)}
                className={`flex-1 h-12 rounded-lg border-2 font-semibold transition-all ${
                  score === num
                    ? 'border-[var(--vf-primary-600)] bg-[var(--vf-primary-600)] text-white'
                    : 'border-[var(--theme-border)] hover:border-[var(--vf-primary-400)]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {score !== null && (
          <>
            <VfTextarea
              label="Was können wir verbessern?"
              placeholder="Ihr Feedback (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
            <Button 
              variant="gradient"
              className="w-full"
              onClick={() => submitMutation.mutate({ score, feedback })}
            >
              Feedback senden
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}