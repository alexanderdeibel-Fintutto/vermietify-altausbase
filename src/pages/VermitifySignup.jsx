import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfButton } from '@/components/shared/VfButton';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import VermitifyLogo from '@/components/branding/VermitifyLogo';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Calculator, FileText, TrendingUp } from 'lucide-react';

export default function VermitifySignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    marketing_consent: false
  });

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      // Create lead first
      await base44.functions.invoke('captureLead', {
        email: data.email,
        name: data.full_name,
        source: 'website',
        source_detail: 'signup_form',
        marketing_consent: data.marketing_consent,
        status: 'trial_started'
      });
      
      // In production: actual user registration
      // For now, redirect to onboarding
    },
    onSuccess: () => {
      navigate(createPageUrl('OnboardingWizardNew'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    signupMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--vf-gradient-primary)] text-white p-12 flex-col justify-between">
        <div>
          <VermitifyLogo size="lg" colorMode="white" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mb-6">
            Immobilien verwalten.<br />
            Steuern sparen.<br />
            Zeit gewinnen.
          </h1>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Objektverwaltung</div>
                <div className="text-sm opacity-90">Alle Immobilien zentral verwaltet</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">9 kostenlose Tools</div>
                <div className="text-sm opacity-90">Rechner für alle wichtigen Kennzahlen</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Automatische Dokumente</div>
                <div className="text-sm opacity-90">Mietverträge, BK, Anlage V - automatisch</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Steueroptimierung</div>
                <div className="text-sm opacity-90">Anlage V mit einem Klick</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm opacity-75">
          Über 2.500 Vermieter vertrauen vermitify
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--theme-background)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <VermitifyLogo size="md" />
          </div>

          <h2 className="text-3xl font-bold mb-2">Kostenlos registrieren</h2>
          <p className="text-[var(--theme-text-secondary)] mb-8">
            14 Tage alle Features testen - keine Kreditkarte erforderlich
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <VfInput
              label="Name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Max Mustermann"
            />

            <VfInput
              label="E-Mail"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="max@example.com"
            />

            <VfCheckbox
              label="Ich möchte Updates und Tipps per E-Mail erhalten"
              checked={formData.marketing_consent}
              onCheckedChange={(v) => setFormData({ ...formData, marketing_consent: v })}
            />

            <VfButton 
              type="submit" 
              variant="gradient"
              fullWidth
              loading={signupMutation.isPending}
            >
              {signupMutation.isPending ? 'Registrierung läuft...' : 'Kostenlos registrieren'}
            </VfButton>

            <p className="text-xs text-center text-[var(--theme-text-muted)]">
              Mit der Registrierung akzeptieren Sie unsere{' '}
              <a href="/agb" className="text-[var(--theme-primary)] hover:underline">AGB</a>
              {' '}und{' '}
              <a href="/datenschutz" className="text-[var(--theme-primary)] hover:underline">Datenschutzerklärung</a>
            </p>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--theme-text-muted)]">
              Bereits registriert?{' '}
              <a href="/login" className="text-[var(--theme-primary)] hover:underline font-medium">
                Jetzt anmelden
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}