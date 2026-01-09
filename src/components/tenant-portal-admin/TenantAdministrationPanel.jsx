import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, FileText, Lock, Settings, History } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import TenantOnboardingManager from '@/components/admin/TenantOnboardingManager';
import OnboardingAuditLog from '@/components/admin/OnboardingAuditLog';

export default function TenantAdministrationPanel({ tenantId, tenant, contract, locks, onBack }) {
  const queryClient = useQueryClient();
  const [selectedLock, setSelectedLock] = useState(null);

  const completeLockMutation = useMutation({
    mutationFn: (lockId) =>
      base44.entities.TenantAdministrationLock.update(lockId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantLocks'] });
      toast.success('Aufgabe abgeschlossen');
      setSelectedLock(null);
    }
  });

  const pendingLocks = locks.filter(l => l.status === 'pending');
  const completedLocks = locks.filter(l => l.status === 'completed');

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>← Zurück</Button>

      {/* Tenant Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{tenant?.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-600">Email</p>
              <p className="font-medium text-slate-900">{tenant?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Portal Status</p>
              <Badge className={tenant?.portal_enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                {tenant?.portal_enabled ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            {contract && (
              <div>
                <p className="text-xs text-slate-600">Monatliche Miete</p>
                <p className="font-medium text-slate-900">{contract.rent_amount}€</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manager" className="w-full">
        <TabsList>
          <TabsTrigger value="manager" className="gap-2">
            <Lock className="w-4 h-4" />
            Onboarding-Verwaltung
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="w-4 h-4" />
            Audit-Log
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Einstellungen
          </TabsTrigger>
        </TabsList>

        {/* Onboarding Manager Tab */}
        <TabsContent value="manager">
          <TenantOnboardingManager tenantId={tenantId} tenant={tenant} />
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <OnboardingAuditLog tenantId={tenantId} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Dokumentenverwaltung wird implementiert</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Einstellungen werden implementiert</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}