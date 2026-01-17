import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfButton } from '@/components/shared/VfButton';
import VermitifyLogo from '@/components/branding/VermitifyLogo';
import { base44 } from '@/api/base44Client';
import { LogIn } from 'lucide-react';

export default function VermitifyLogin() {
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <VermitifyLogo size="lg" className="mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">Willkommen zurück</h1>
          <p className="text-[var(--theme-text-secondary)]">
            Melden Sie sich an, um fortzufahren
          </p>
        </div>

        <div className="vf-card p-8">
          <VfButton 
            variant="gradient"
            fullWidth
            icon={LogIn}
            onClick={handleLogin}
          >
            Mit E-Mail anmelden
          </VfButton>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--theme-text-muted)]">
              Noch kein Konto?{' '}
              <a href="/signup" className="text-[var(--theme-primary)] hover:underline font-medium">
                Jetzt registrieren
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/tools" className="text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)]">
            Oder nutzen Sie unsere kostenlosen Tools →
          </a>
        </div>
      </div>
    </div>
  );
}