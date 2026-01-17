import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Mail, CheckCircle } from 'lucide-react';

export default function NewsletterSignup({ inline = false }) {
  const [email, setEmail] = useState('');

  const subscribeMutation = useMutation({
    mutationFn: async (email) => {
      await base44.functions.invoke('captureLead', {
        email,
        source: 'newsletter',
        marketing_consent: true,
        consent_date: new Date().toISOString()
      });
    },
    onSuccess: () => setEmail('')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    subscribeMutation.mutate(email);
  };

  if (subscribeMutation.isSuccess) {
    return (
      <div className="flex items-center gap-2 text-[var(--vf-success-600)]">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Erfolgreich angemeldet!</span>
      </div>
    );
  }

  if (inline) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
        <VfInput
          type="email"
          placeholder="ihre@email.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" variant="gradient" disabled={subscribeMutation.isPending}>
          {subscribeMutation.isPending ? '...' : 'Anmelden'}
        </Button>
      </form>
    );
  }

  return (
    <div className="bg-[var(--vf-primary-50)] rounded-xl p-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-[var(--vf-gradient-primary)] flex items-center justify-center text-white flex-shrink-0">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Newsletter abonnieren</h3>
          <p className="text-[var(--theme-text-secondary)]">
            Erhalten Sie Tipps, Updates und Neuigkeiten für erfolgreiche Vermieter
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <VfInput
          type="email"
          placeholder="Ihre E-Mail-Adresse"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button 
          type="submit" 
          variant="gradient"
          className="w-full"
          disabled={subscribeMutation.isPending}
        >
          {subscribeMutation.isPending ? 'Wird angemeldet...' : 'Jetzt anmelden'}
        </Button>
        <p className="text-xs text-[var(--theme-text-muted)]">
          Kostenlos. Jederzeit abbestellbar. Kein Spam.
        </p>
      </form>
    </div>
  );
}