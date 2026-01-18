import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <div className="bg-[var(--theme-surface)] p-8 rounded-xl">
      <div className="max-w-md mx-auto text-center">
        <Mail className="h-8 w-8 mx-auto mb-4 text-[var(--theme-primary)]" />
        <h3 className="text-xl font-semibold mb-2">Bleiben Sie informiert</h3>
        <p className="text-sm text-[var(--theme-text-secondary)] mb-6">
          Erhalten Sie die neuesten Updates und Tipps
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <VfInput
            type="email"
            placeholder="Ihre E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button variant="gradient" type="submit">
            Anmelden
          </Button>
        </form>
      </div>
    </div>
  );
}