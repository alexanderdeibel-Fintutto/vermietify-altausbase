import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AutomationDashboard from '@/components/wealth/AutomationDashboard';
import { Loader2 } from 'lucide-react';

export default function WealthAutomationPage() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: portfolio = [], isLoading } = useQuery({
    queryKey: ['assetPortfolio', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const results = await base44.entities.AssetPortfolio.filter(
        { user_id: currentUser.id, status: 'active' },
        '-created_date',
        100
      );
      return results || [];
    },
    enabled: !!currentUser?.id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Automatisierung</h1>
        <p className="text-sm font-light text-slate-600 mt-1">
          Richten Sie automatische Kursupdates, Alerts und Analysen ein
        </p>
      </div>

      <AutomationDashboard portfolio={portfolio} />
    </div>
  );
}