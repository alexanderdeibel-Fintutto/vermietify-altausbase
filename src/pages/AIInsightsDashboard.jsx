import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp, Wrench, MessageSquare, Users } from 'lucide-react';
import CommunicationInsightsWidget from '@/components/ai-insights/CommunicationInsightsWidget';
import MaintenancePredictionsWidget from '@/components/ai-insights/MaintenancePredictionsWidget';
import TenantFeedbackWidget from '@/components/ai-insights/TenantFeedbackWidget';
import InsightsOverviewCards from '@/components/ai-insights/InsightsOverviewCards';

export default function AIInsightsDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Building.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const companyId = buildings[0]?.company_id;

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Lade KI-Einblicke...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          KI-Einblicke Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Zentrale Übersicht aller KI-gestützten Analysen und Vorhersagen
        </p>
      </div>

      <InsightsOverviewCards companyId={companyId} buildings={buildings} />

      <div className="grid lg:grid-cols-2 gap-6">
        <CommunicationInsightsWidget companyId={companyId} />
        <MaintenancePredictionsWidget buildings={buildings} />
      </div>

      <TenantFeedbackWidget companyId={companyId} />
    </div>
  );
}