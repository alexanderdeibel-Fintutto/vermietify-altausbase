import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import WorkflowExecutionMonitor from '@/components/workflows/WorkflowExecutionMonitor';
import { Zap } from 'lucide-react';

export default function WorkflowExecutionCenter() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Workflow-Ausführungszentrum</h1>
          <p className="text-slate-600">Verwalten Sie laufende und abgeschlossene Workflow-Instanzen</p>
        </div>
      </div>

      {/* Execution Monitor */}
      {user && <WorkflowExecutionMonitor companyId={user.id} />}
    </div>
  );
}