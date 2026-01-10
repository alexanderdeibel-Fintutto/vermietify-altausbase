import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import WorkflowAISuggestions from '@/components/workflows/WorkflowAISuggestions';
import WorkflowAIAssistant from '@/components/workflows/WorkflowAIAssistant';

export default function WorkflowAI() {
  const [showAssistant, setShowAssistant] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow-KI</h1>
          <p className="text-slate-600 text-sm mt-1">
            KI-gestützte Vorschläge und Optimierungen
          </p>
        </div>
        <Button
          onClick={() => setShowAssistant(true)}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          KI-Assistent
        </Button>
      </div>

      {companyId && <WorkflowAISuggestions companyId={companyId} />}

      <WorkflowAIAssistant
        companyId={companyId}
        isOpen={showAssistant}
        onOpenChange={setShowAssistant}
      />
    </div>
  );
}