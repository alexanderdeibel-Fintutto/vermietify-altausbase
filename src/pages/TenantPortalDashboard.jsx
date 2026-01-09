import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, MessageSquare, Wrench, Home, Search, Download, User, LogOut } from 'lucide-react';
import TenantPortalWelcome from '@/components/tenant-portal/TenantPortalWelcome';
import MaintenanceRequestForm from '@/components/tenant-portal/MaintenanceRequestForm';
import TenantMessagingInterface from '@/components/messaging/TenantMessagingInterface';
import TenantDocumentsViewer from '@/components/tenant-portal/TenantDocumentsViewer';
import TenantNotificationCenter from '@/components/tenant-portal/TenantNotificationCenter';

export default function TenantPortalDashboard() {
  const [tenantId] = useState(new URLSearchParams(window.location.search).get('id'));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenantPortalData', tenantId],
    queryFn: async () => {
      const tenants = await base44.entities.Tenant.filter({ id: tenantId }, null, 1);
      return tenants[0];
    },
    enabled: !!tenantId
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenantContracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }, '-start_date', 10),
    enabled: !!tenantId
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['tenantPayments', tenantId],
    queryFn: () => base44.entities.Payment.filter({ tenant_email: tenant?.email }, '-payment_date', 10),
    enabled: !!tenant?.email
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['tenantMaintenance', tenantId],
    queryFn: () => base44.entities.MaintenanceTask.filter({ tenant_id: tenantId }, '-created_at', 20),
    enabled: !!tenantId
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['tenantCommunications', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter({ tenant_id: tenantId }, '-created_at', 20),
    enabled: !!tenantId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['tenantDocuments', tenantId],
    queryFn: () => base44.entities.Document.filter({ related_entity_id: tenantId }, '-created_at', 50),
    enabled: !!tenantId
  });

  if (tenantLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Mieter nicht gefunden</p>
            <Button onClick={() => window.location.reload()}>Neu laden</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeContracts = contracts.filter(c => new Date(c.end_date) > new Date());
  const pendingMaintenance = maintenanceRequests.filter(m => m.status !== 'completed');
  const unreadMessages = communications.filter(c => !c.read);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                {tenant.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1>
                <p className="text-xs text-slate-500">{tenant.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TenantNotificationCenter tenantId={tenantId} />
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <TenantPortalWelcome tenant={tenant} />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Aktive Verträge</p>
                <p className="text-3xl font-bold text-blue-600">{activeContracts.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Ausstehende Anfragen</p>
                <p className="text-3xl font-bold text-amber-600">{pendingMaintenance.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Neue Nachrichten</p>
                <p className="text-3xl font-bold text-purple-600">{unreadMessages.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Dokumente</p>
                <p className="text-3xl font-bold text-green-600">{documents.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Verträge, Zahlungen, Dokumente durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="contracts">Verträge</TabsTrigger>
            <TabsTrigger value="maintenance">Anfragen</TabsTrigger>
            <TabsTrigger value="messages">Nachrichten</TabsTrigger>
            <TabsTrigger value="documents">Dokumente</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Contracts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Aktive Mietverträge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeContracts.length === 0 ? (
                    <p className="text-slate-600 text-sm">Keine aktiven Verträge</p>
                  ) : (
                    activeContracts.slice(0, 3).map(c => (
                      <div key={c.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm">{c.property_address}</span>
                          <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                          <div>Miete: <span className="font-semibold">{(c.monthly_rent || 0).toLocaleString('de-DE')}€</span></div>
                          <div>Bis: <span className="font-semibold">{new Date(c.end_date).toLocaleDateString('de-DE')}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zahlungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payments.length === 0 ? (
                    <p className="text-slate-600 text-sm">Keine Zahlungen</p>
                  ) : (
                    payments.slice(0, 3).map(p => (
                      <div key={p.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{(p.amount || 0).toLocaleString('de-DE')}€</span>
                          <Badge className={p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} variant="outline">
                            {p.status === 'completed' ? 'Gezahlt' : 'Ausstehend'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{new Date(p.payment_date).toLocaleDateString('de-DE')}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Schnellaktionen</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => setShowMaintenanceForm(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Wrench className="w-4 h-4" />
                  Wartungsanfrage
                </Button>
                <Button onClick={() => setActiveTab('messages')} variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Team kontaktieren
                </Button>
                <Button onClick={() => setActiveTab('documents')} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Dokumente
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-3">
            {contracts.length === 0 ? (
              <Card>
                <CardContent className="pt-4 text-center text-slate-600">Keine Verträge vorhanden</CardContent>
              </Card>
            ) : (
              contracts.map(c => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{c.property_address}</CardTitle>
                      <Badge className={new Date(c.end_date) < new Date() ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                        {new Date(c.end_date) < new Date() ? 'Beendet' : 'Aktiv'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-600">Startdatum</p>
                        <p className="font-semibold">{new Date(c.start_date).toLocaleDateString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Enddatum</p>
                        <p className="font-semibold">{new Date(c.end_date).toLocaleDateString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Miete monatlich</p>
                        <p className="font-semibold text-blue-600">{(c.monthly_rent || 0).toLocaleString('de-DE')}€</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Kaution</p>
                        <p className="font-semibold">{(c.deposit || 0).toLocaleString('de-DE')}€</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="mb-4">
              <Button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="w-full gap-2">
                <Wrench className="w-4 h-4" />
                Neue Anfrage erstellen
              </Button>
            </div>
            {showMaintenanceForm && <MaintenanceRequestForm tenantId={tenantId} onSubmit={() => setShowMaintenanceForm(false)} />}
            <div className="space-y-3">
              {maintenanceRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-4 text-center text-slate-600">Keine Anfragen vorhanden</CardContent>
                </Card>
              ) : (
                maintenanceRequests.map(req => (
                  <Card key={req.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{req.title}</CardTitle>
                          <p className="text-xs text-slate-500 mt-1">{new Date(req.created_at).toLocaleDateString('de-DE')}</p>
                        </div>
                        <Badge className={
                          req.status === 'completed' ? 'bg-green-100 text-green-800' :
                          req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {req.status === 'completed' ? 'Abgeschlossen' : req.status === 'in_progress' ? 'In Bearbeitung' : 'Ausstehend'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">{req.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <TenantMessagingInterface tenantId={tenantId} tenantEmail={tenant?.email} />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <TenantDocumentsViewer documents={documents} searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}