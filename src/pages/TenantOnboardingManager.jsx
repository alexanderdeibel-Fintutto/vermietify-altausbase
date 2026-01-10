import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, FileText, Send } from 'lucide-react';
import TenantOnboardingWizard from '@/components/onboarding/TenantOnboardingWizard';
import OnboardingStatusTracker from '@/components/onboarding/OnboardingStatusTracker';

export default function TenantOnboardingManager() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);

  const { data: onboardings = [] } = useQuery({
    queryKey: ['tenant-onboardings'],
    queryFn: () => base44.entities.TenantOnboarding.list('-created_date', 100)
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-onboarding'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-onboarding'],
    queryFn: () => base44.entities.Building.list()
  });

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
  };

  const getBuildingName = (buildingId) => {
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || 'Unbekannt';
  };

  const activeOnboardings = onboardings.filter(o => o.status !== 'completed');
  const completedOnboardings = onboardings.filter(o => o.status === 'completed');

  const getStatusBadge = (status) => {
    const config = {
      initiated: { label: 'Gestartet', variant: 'secondary' },
      documents_generated: { label: 'Dokumente erstellt', variant: 'default' },
      documents_sent: { label: 'Versendet', variant: 'default' },
      documents_signed: { label: 'Unterschrieben', variant: 'default' },
      keys_handed: { label: 'Schlüssel übergeben', variant: 'default' },
      completed: { label: 'Abgeschlossen', variant: 'outline' }
    };
    const c = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mieter-Onboarding</h1>
          <p className="text-slate-600 mt-1">Automatisierte Einzugsverwaltung</p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Onboarding
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aktiv</p>
                <p className="text-2xl font-bold">{activeOnboardings.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Abgeschlossen</p>
                <p className="text-2xl font-bold">{completedOnboardings.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamt</p>
                <p className="text-2xl font-bold">{onboardings.length}</p>
              </div>
              <Send className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Onboardings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aktive Onboardings</h2>
        {activeOnboardings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeOnboardings.map((onboarding) => (
              <Card 
                key={onboarding.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedOnboarding(onboarding)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{getTenantName(onboarding.tenant_id)}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{getBuildingName(onboarding.building_id)}</p>
                    </div>
                    {getStatusBadge(onboarding.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Fortschritt</span>
                      <span className="font-semibold">{onboarding.progress_percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${onboarding.progress_percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="w-3 h-3" />
                      {onboarding.generated_documents?.length || 0} Dokumente
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Keine aktiven Onboardings</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wizard */}
      <TenantOnboardingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Status Tracker Dialog */}
      {selectedOnboarding && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOnboarding(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <OnboardingStatusTracker onboardingId={selectedOnboarding.id} />
          </div>
        </div>
      )}
    </div>
  );
}