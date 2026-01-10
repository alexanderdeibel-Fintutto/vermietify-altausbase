import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowPredictions from '@/components/reporting/WorkflowPredictions';
import CustomDashboardBuilder from '@/components/reporting/CustomDashboardBuilder';
import ReportScheduleManager from '@/components/reporting/ReportScheduleManager';
import { TrendingUp, LayoutGrid, Mail } from 'lucide-react';

export default function AdvancedWorkflowAnalytics() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['user-building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({});
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.id || user?.company_id;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Erweiterte Workflow-Analysen</h1>
        <p className="text-slate-600 text-sm mt-1">
          Prognosen, benutzerdefinierte Dashboards und automatische Berichte
        </p>
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Prognosen</span>
          </TabsTrigger>
          <TabsTrigger value="dashboards" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboards</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Berichte</span>
          </TabsTrigger>
        </TabsList>

        {companyId && (
          <>
            <TabsContent value="predictions" className="mt-4">
              <WorkflowPredictions companyId={companyId} />
            </TabsContent>

            <TabsContent value="dashboards" className="mt-4">
              <CustomDashboardBuilder companyId={companyId} />
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              <ReportScheduleManager companyId={companyId} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}