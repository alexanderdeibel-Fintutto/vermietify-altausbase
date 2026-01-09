import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantFeedbackForm({ tenantId, tenantEmail, tenantName }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    feedback_type: 'general',
    subject: '',
    message: ''
  });
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.TenantFeedback.create({
        tenant_id: tenantId,
        tenant_email: tenantEmail,
        tenant_name: tenantName,
        ...data,
        rating,
        status: 'new',
        created_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantFeedback'] });
      toast.success('Feedback erfolgreich gesendet!');
      // Reset form
      setFormData({ feedback_type: 'general', subject: '', message: '' });
      setRating(0);
    },
    onError: (error) => {
      toast.error('Fehler beim Senden: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('Bitte geben Sie eine Nachricht ein');
      return;
    }
    submitFeedbackMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Feedback geben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Feedback-Typ</Label>
            <Select
              value={formData.feedback_type}
              onValueChange={(value) => setFormData({ ...formData, feedback_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">Onboarding-Erfahrung</SelectItem>
                <SelectItem value="portal_usability">Portal-Benutzerfreundlichkeit</SelectItem>
                <SelectItem value="services">Dienstleistungen</SelectItem>
                <SelectItem value="communication">Kommunikation</SelectItem>
                <SelectItem value="maintenance">Wartung & Instandhaltung</SelectItem>
                <SelectItem value="general">Allgemeines</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Betreff</Label>
            <Input
              placeholder="Kurze Beschreibung..."
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div>
            <Label>Ihre Nachricht</Label>
            <Textarea
              placeholder="Teilen Sie uns Ihr Feedback mit..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="min-h-32"
              required
            />
          </div>

          <div>
            <Label className="mb-2 block">Bewertung</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitFeedbackMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Feedback senden
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}