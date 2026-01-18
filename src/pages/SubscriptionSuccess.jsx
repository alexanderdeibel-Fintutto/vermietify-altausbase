import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[var(--vf-success-100)] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-[var(--vf-success-600)]" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Willkommen an Bord! 🎉</h1>
        
        <p className="text-[var(--theme-text-secondary)] mb-8">
          Ihr Abonnement wurde erfolgreich aktiviert. Sie haben jetzt Zugriff auf alle Premium-Features.
        </p>

        <Link to={createPageUrl('Dashboard')}>
          <Button variant="gradient" size="lg" className="w-full">
            Zum Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}