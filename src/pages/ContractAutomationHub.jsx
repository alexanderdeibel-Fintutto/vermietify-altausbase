import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AutomatedContractWorkflow from '@/components/contracts/AutomatedContractWorkflow';

export default function ContractAutomationHub() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Automatisierter Vertragsabschluss</h1>
        <p className="text-slate-600 mt-1">
          Von Bewerber zu Mieter in wenigen Klicks
        </p>
      </div>

      <AutomatedContractWorkflow companyId={companyId} />

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Workflow-Schritte:</h3>
        <ol className="text-xs space-y-1 text-slate-700">
          <li>1. Vertrag aus Vorlage + Bewerberdaten generieren</li>
          <li>2. Versand zur elektronischen Signatur</li>
          <li>3. Automatische Erstellung: Mieter, Vertrag, Kaution, Mietschulden-Tracking</li>
          <li>4. Willkommenspaket & Mieterportal-Aktivierung</li>
        </ol>
      </div>
    </div>
  );
}