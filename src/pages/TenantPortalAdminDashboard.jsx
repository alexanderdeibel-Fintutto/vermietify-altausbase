import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MessageSquare, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import TenantPortalCard from '@/components/tenant-portal-admin/TenantPortalCard';
import TenantAdministrationPanel from '@/components/tenant-portal-admin/TenantAdministrationPanel';

export default function TenantPortalAdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list('-created_at', 100)
  });

  const { data: leaseContracts = [] } = useQuery({
    queryKey: ['leaseContracts'],
    queryFn: () => base44.entities.LeaseContract.list('-created_at', 100)
  });

  const { data: tenantLocks = [] } = useQuery({
    queryKey: ['tenantLocks'],
    queryFn: () => base44.entities.TenantAdministrationLock.list('-created_at', 100)
  });

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTenantLocks = (tenantId) => {
    return tenantLocks.filter(lock => lock.tenant_id === tenantId);
  };

  const getTenantLeaseContract = (tenantId) => {
    return leaseContracts.find(contract => contract.tenant_id === tenantId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Mieterportal-Verwaltung</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie alle Mieter und deren Portale</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="administration">Verwaltung</TabsTrigger>
          <TabsTrigger value="communication">Kommunikation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Aktive Mieter</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">{tenants.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Mietverträge</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">{leaseContracts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Ausstehende Aufgaben</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">
                  {tenantLocks.filter(l => l.status === 'pending').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Portale aktiv</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">
                  {tenants.filter(t => t.portal_enabled).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tenant Cards Grid */}
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Nach Mieter suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredTenants.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-slate-600">
                  Keine Mieter gefunden
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTenants.map(tenant => {
                  const contract = getTenantLeaseContract(tenant.id);
                  const locks = getTenantLocks(tenant.id);
                  const pendingLocks = locks.filter(l => l.status === 'pending').length;

                  return (
                    <TenantPortalCard
                      key={tenant.id}
                      tenant={tenant}
                      contract={contract}
                      pendingLocks={pendingLocks}
                      onSelect={() => setSelectedTenant(tenant.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Administration Tab */}
        <TabsContent value="administration">
          {selectedTenant ? (
            <TenantAdministrationPanel
              tenantId={selectedTenant}
              tenant={tenants.find(t => t.id === selectedTenant)}
              contract={getTenantLeaseContract(selectedTenant)}
              locks={getTenantLocks(selectedTenant)}
              onBack={() => setSelectedTenant(null)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-slate-600">
                Wählen Sie einen Mieter aus der Übersicht aus, um ihn zu verwalten
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          {selectedTenant ? (
            <div>
              <Button variant="outline" onClick={() => setSelectedTenant(null)} className="mb-4">
                Zurück zur Übersicht
              </Button>
              <TenantCommunicationAdmin
                tenantId={selectedTenant}
                tenant={tenants.find(t => t.id === selectedTenant)}
                locks={getTenantLocks(selectedTenant)}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-slate-600">
                Wählen Sie einen Mieter aus, um mit ihm zu kommunizieren
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TenantCommunicationAdmin({ tenantId, tenant, locks }) {
  return (
    <div className="space-y-6">
      {/* Locks Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Verwaltungsaufgaben
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {locks.length === 0 ? (
            <p className="text-sm text-slate-600">Keine ausstehenden Aufgaben</p>
          ) : (
            locks.map(lock => (
              <div key={lock.id} className="p-3 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{lock.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{lock.description}</p>
                  </div>
                  <Badge
                    className={
                      lock.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : lock.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }
                  >
                    {lock.status === 'pending' ? 'Ausstehend' : 'Erledigt'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Fällig: {new Date(lock.due_date).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Nachrichten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded">
            Kommunikationsmodul wird implementiert
          </div>
        </CardContent>
      </Card>
    </div>
  );
}