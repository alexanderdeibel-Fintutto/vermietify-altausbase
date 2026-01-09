import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TesterInvitationForm from '@/components/testing/TesterInvitationForm.jsx';
import TesterStatsWidget from '@/components/testing/TesterStatsWidget.jsx';
import TesterListTable from '@/components/testing/TesterListTable.jsx';
import PendingInvitationsTable from '@/components/testing/PendingInvitationsTable.jsx';
import TesterActivityFeed from '@/components/testing/TesterActivityFeed.jsx';

export default function TesterManagement() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['testerDashboard', refreshKey],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTesterDashboardData', {});
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 Minuten
  });

  const handleInvitationSent = () => {
    setShowInviteForm(false);
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Tester Management" 
        subtitle="Verwalte Tester, Einladungen und Feedback"
        action={() => setShowInviteForm(!showInviteForm)}
        actionLabel="Tester Einladen"
      />

      {showInviteForm && (
        <Card className="p-6 border border-slate-200">
          <TesterInvitationForm onSuccess={handleInvitationSent} />
        </Card>
      )}

      {/* Schnellstatistiken */}
      <TesterStatsWidget stats={dashboardData?.stats} />

      {/* Tabs für verschiedene Ansichten */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Aktive Tester ({dashboardData?.stats?.all_testers || 0})</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend ({dashboardData?.stats?.pending_invitations || 0})</TabsTrigger>
          <TabsTrigger value="activity">Aktivitäten</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <TesterListTable testers={dashboardData?.testers || []} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingInvitationsTable 
            invitations={dashboardData?.pending_invitations || []}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <TesterActivityFeed activities={dashboardData?.recent_activities || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}