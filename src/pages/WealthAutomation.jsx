import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AutomationDashboard from '@/components/wealth/AutomationDashboard';
import AutomationWizard from '@/components/wealth/AutomationWizard';

export default function WealthAutomationPage() {
  const [showWizard, setShowWizard] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Automatisierung & Alerts</h1>
          <p className="text-sm font-light text-slate-600 mt-1">
            Konfigurieren Sie automatische Kursupdates, Alerts und Portfolio-Analysen
          </p>
        </div>
        <Button 
          onClick={() => setShowWizard(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Automatisierung einrichten
        </Button>
      </div>

      {currentUser && (
        <>
          <AutomationDashboard userId={currentUser.id} />
          <AutomationWizard 
            open={showWizard}
            onOpenChange={setShowWizard}
            userId={currentUser.id}
          />
        </>
      )}
    </div>
  );
}