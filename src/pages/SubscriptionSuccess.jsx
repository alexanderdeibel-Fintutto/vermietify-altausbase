import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)] p-6">
      <div className="max-w-lg text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--vf-success-100)] flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-[var(--vf-success-600)]" />
        </div>

        <h1 className="text-4xl font-bold mb-4">Willkommen an Bord! 🎉</h1>
        
        <p className="text-xl text-[var(--theme-text-secondary)] mb-8">
          Ihr Abonnement wurde erfolgreich aktiviert. 
          Sie haben jetzt Zugriff auf alle Premium-Features.
        </p>

        <div className="vf-card p-6 mb-8">
          <h3 className="font-semibold mb-3">Was Sie jetzt tun können:</h3>
          <ul className="text-left space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)] mt-0.5" />
              Unbegrenzt Objekte anlegen
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)] mt-0.5" />
              Anlage V automatisch erstellen
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)] mt-0.5" />
              BK-Abrechnungen automatisieren
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)] mt-0.5" />
              Dokumente automatisch versenden
            </li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="gradient" size="lg" onClick={() => navigate(createPageUrl('Dashboard'))}>
            <Zap className="h-5 w-5 mr-2" />
            Zum Dashboard
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(createPageUrl('QuickStartGuide'))}>
            Schnellstart-Anleitung
          </Button>
        </div>
      </div>
    </div>
  );
}