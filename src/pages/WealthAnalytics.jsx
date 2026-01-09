import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import AdvancedAnalyticsDashboard from '@/components/wealth/AdvancedAnalyticsDashboard';
import RiskAssessmentPanel from '@/components/wealth/RiskAssessmentPanel';
import PredictiveAnalyticsPanel from '@/components/wealth/PredictiveAnalyticsPanel';

export default function WealthAnalyticsPage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const u = await base44.auth.me();
      return u;
    }
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.AssetPortfolio.filter({ user_id: user.id }) || [];
    },
    enabled: !!user?.id
  });

  const { data: performanceData = [] } = useQuery({
    queryKey: ['performanceData', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.AssetPerformanceHistory.filter({ user_id: user.id }, '-date', 90) || [];
    },
    enabled: !!user?.id
  });

  if (!user) {
    return <div className="p-6">Bitte melden Sie sich an.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Erweiterte Analysen</h1>
        <p className="text-slate-600 mt-2">KI-gestützte Insights und Prognosen für Ihr Portfolio</p>
      </div>

      <AdvancedAnalyticsDashboard userId={user.id} />
      <RiskAssessmentPanel portfolio={portfolio} />
      <PredictiveAnalyticsPanel portfolio={portfolio} performanceData={performanceData} />
    </div>
  );
}