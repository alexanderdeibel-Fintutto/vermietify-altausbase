import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WorkflowReportBuilder from '@/components/reporting/WorkflowReportBuilder';
import { BarChart3 } from 'lucide-react';

export default function WorkflowReporting() {
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Workflow-Berichterstattung
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Analysen und Berichte zu Workflow-Ausführungen
        </p>
      </div>

      {companyId ? (
        <WorkflowReportBuilder companyId={companyId} />
      ) : (
        <Card className="bg-slate-50">
          <CardContent className="pt-6 text-center text-slate-500">
            Firmeninformationen werden geladen...
          </CardContent>
        </Card>
      )}
    </div>
  );
}