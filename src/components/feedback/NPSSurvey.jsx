import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { ThumbsUp } from 'lucide-react';

export default function NPSSurvey({ onSubmit }) {
  const [score, setScore] = useState(null);
  const [comment, setComment] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ThumbsUp className="h-5 w-5" />
          Wie zufrieden sind Sie?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            {[...Array(11)].map((_, i) => (
              <button
                key={i}
                onClick={() => setScore(i)}
                className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                  score === i 
                    ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white' 
                    : 'border-[var(--theme-border)] hover:border-[var(--theme-primary)]'
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-[var(--theme-text-muted)]">
            <span>Unwahrscheinlich</span>
            <span>Sehr wahrscheinlich</span>
          </div>

          {score !== null && (
            <VfTextarea
              placeholder="Was können wir verbessern?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          )}

          <Button 
            variant="gradient" 
            className="w-full"
            disabled={score === null}
            onClick={() => onSubmit({ score, comment })}
          >
            Feedback senden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}