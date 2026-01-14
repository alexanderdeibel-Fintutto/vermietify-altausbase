import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, ThumbsDown, Meh, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function UserFeedbackCollector({ open, onOpenChange, context = {} }) {
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating && !feedback) {
      toast.error('Bitte geben Sie eine Bewertung oder Feedback ab');
      return;
    }

    setSubmitting(true);
    try {
      // Track as analytics event
      base44.analytics.track({
        eventName: 'user_feedback_submitted',
        properties: {
          rating: rating,
          has_text: feedback.length > 0,
          feedback_length: feedback.length,
          context_page: context.page || window.location.pathname,
          context_feature: context.feature || 'general'
        }
      });

      // Save to TenantFeedback entity (repurposed for general user feedback)
      await base44.entities.TenantFeedback.create({
        feedback_type: context.feature || 'general',
        rating: rating,
        comment: feedback,
        page_context: context.page || window.location.pathname,
        feature_context: JSON.stringify(context),
        status: 'new'
      });

      toast.success('Vielen Dank für Ihr Feedback!');
      onOpenChange(false);
      setRating(null);
      setFeedback('');
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Fehler beim Senden des Feedbacks');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Ihr Feedback ist wichtig
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-3 block">Wie zufrieden sind Sie mit dieser Funktion?</Label>
            <div className="flex gap-3 justify-center">
              {[
                { value: 1, icon: ThumbsDown, label: 'Schlecht', color: 'red' },
                { value: 2, icon: Meh, label: 'Okay', color: 'amber' },
                { value: 3, icon: ThumbsUp, label: 'Gut', color: 'emerald' }
              ].map(({ value, icon: Icon, label, color }) => (
                <motion.button
                  key={value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRating(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    rating === value 
                      ? `border-${color}-500 bg-${color}-50` 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 ${rating === value ? `text-${color}-600` : 'text-slate-400'}`} />
                  <span className="text-xs font-medium">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <Label>Zusätzliche Anmerkungen (optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Was können wir verbessern? Welche Funktionen fehlen Ihnen?"
              rows={4}
              className="mt-2"
            />
          </div>

          {context.feature && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">
                Feedback zu: <Badge variant="outline">{context.feature}</Badge>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting || (!rating && !feedback)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Feedback senden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Floating feedback button
export function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState({});

  React.useEffect(() => {
    // Listen for feedback requests from other components
    const handleFeedbackRequest = (event) => {
      setContext(event.detail);
      setOpen(true);
    };

    window.addEventListener('request-feedback', handleFeedbackRequest);
    return () => window.removeEventListener('request-feedback', handleFeedbackRequest);
  }, []);

  return (
    <>
      <button
        onClick={() => {
          setContext({ page: window.location.pathname });
          setOpen(true);
        }}
        className="fixed bottom-6 left-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        title="Feedback geben"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <UserFeedbackCollector open={open} onOpenChange={setOpen} context={context} />
    </>
  );
}