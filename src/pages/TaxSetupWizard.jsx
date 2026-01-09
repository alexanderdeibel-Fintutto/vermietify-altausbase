import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CountrySetup from '@/components/tax/CountrySetup';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';

export default function TaxSetupWizard() {
  const navigate = useNavigate();
  const [setupCompleted, setSetupCompleted] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (user?.tax_setup_completed) {
    navigate(createPageUrl('Dashboard'));
    return null;
  }

  const handleSetupComplete = () => {
    setSetupCompleted(true);
    setTimeout(() => {
      navigate(createPageUrl('TaxDashboard'));
    }, 2000);
  };

  if (setupCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl mb-4">✅ Fertig!</p>
            <p className="text-slate-600">Ihre Steuerkonfiguration wurde gespeichert. Sie werden weitergeleitet...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CountrySetup onComplete={handleSetupComplete} />
    </div>
  );
}