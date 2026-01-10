import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantFeedbackCollector({ tenantId }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.TenantFeedback.create({
        tenant_id: tenantId,
        rating,
        feedback,
        category: 'service',
        status: 'new'
      });
    },
    onSuccess: () => {
      toast.success('Feedback gespeichert');
      setRating(0);
      setFeedback('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Mieter-Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-semibold mb-2">Zufriedenheit</p>
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)}>
                <Star
                  className={`w-10 h-10 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <Textarea
          placeholder="Anmerkungen des Mieters..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
        />

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={rating === 0}
          className="w-full bg-green-600"
        >
          Feedback speichern
        </Button>
      </CardContent>
    </Card>
  );
}