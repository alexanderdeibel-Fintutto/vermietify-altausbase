import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import BankSyncPanel from '@/components/wealth/BankSyncPanel';
import DataEnrichmentPanel from '@/components/wealth/DataEnrichmentPanel';

export default function WealthIntegrationsPage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.AssetPortfolio.filter({ user_id: user.id }) || [];
    },
    enabled: !!user?.id
  });

  if (!user) {
    return <div className="p-6">Bitte melden Sie sich an.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Integrationen & Datenquellen</h1>
        <p className="text-slate-600 mt-2">Verbinden Sie externe Services für automatische Datenaktualisierungen</p>
      </div>

      <BankSyncPanel userId={user.id} />
      <DataEnrichmentPanel portfolio={portfolio} />
    </div>
  );
}