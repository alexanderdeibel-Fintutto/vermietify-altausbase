import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import AdvancedTaxStrategyPanel from '@/components/tax/AdvancedTaxStrategyPanel';

export default function TaxOptimizationStrategy() {
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.TaxProfile.list();
      return profiles[0];
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-900">
            Bitte vervollständigen Sie zunächst Ihr Steuerprofil in den Einstellungen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-light mb-2">Erweiterte Steueropitmierung</h1>
        <p className="text-slate-600">
          Personalisierte Strategien für Investitionen, Unternehmensstruktur und Nachlassplanung
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AdvancedTaxStrategyPanel userProfile={userProfile} />
      </div>
    </div>
  );
}