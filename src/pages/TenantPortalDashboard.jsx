import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, MessageSquare, Wrench, Home } from 'lucide-react';

export default function TenantPortalDashboard() {
  const [tenantId] = useState(
    new URLSearchParams(window.location.search).get('id')
  );

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenantPortalData', tenantId],
    queryFn: async () => {
      const tenants = await base44.entities.Tenant.filter(
        { id: tenantId },
        null,
        1
      );
      return tenants[0];
    },
    enabled: !!tenantId
  });

  const { data: contracts } = useQuery({
    queryKey: ['tenantContracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter(
      { tenant_id: tenantId },
      '-start_date',
      10
    ),
    enabled: !!tenantId,
    initialData: []
  });

  const { data: payments } = useQuery({
    queryKey: ['tenantPayments', tenantId],
    queryFn: () => base44.entities.Payment.filter(
      { tenant_email: tenant?.email },
      '-payment_date',
      10
    ),
    enabled: !!tenant?.email,
    initialData: []
  });

  const { data: maintenanceRequests } = useQuery({
    queryKey: ['tenantMaintenance', tenantId],
    queryFn: () => base44.entities.MaintenanceTask.filter(
      { tenant_id: tenantId },
      '-created_at',
      10
    ),
    enabled: !!tenantId,
    initialData: []
  });

  const { data: communications } = useQuery({
    queryKey: ['tenantCommunications', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter(
      { tenant_id: tenantId },
      '-created_at',
      10
    ),
    enabled: !!tenantId,
    initialData: []
  });

  const { data: documents } = useQuery({
    queryKey: ['tenantDocuments', tenantId],
    queryFn: () => base44.entities.Document.filter(
      { related_entity_id: tenantId },
      '-created_at',
      20
    ),
    enabled: !!tenantId,
    initialData: []
  });

  if (tenantLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center pt-12">
        <p className="text-slate-600">Mieter nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">{tenant.name}</h1>
        <p className="text-blue-100 mt-1">{tenant.email}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 font-semibold mb-1">Aktive Mietverträge</p>
            <p className="text-2xl font-bold text-blue-600">
              {contracts.filter(c => new Date(c.end_date) > new Date()).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 font-semibold mb-1">Zahlungen (30 Tage)</p>
            <p className="text-2xl font-bold text-green-600">
              {payments.filter(p => 
                new Date(p.payment_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 font-semibold mb-1">Offene Anfragen</p>
            <p className="text-2xl font-bold text-amber-600">
              {maintenanceRequests.filter(m => m.status !== 'completed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 font-semibold mb-1">Nachrichten</p>
            <p className="text-2xl font-bold text-purple-600">
              {communications.filter(c => !c.read).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contracts" className="gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Verträge</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Zahlungen</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Anfragen</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Nachrichten</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Dokumente</span>
          </TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-3">
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="pt-4 text-center text-slate-600">
                Keine Mietverträge vorhanden
              </CardContent>
            </Card>
          ) : (
            contracts.map(contract => (
              <Card key={contract.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                      {contract.property_address}
                    </CardTitle>
                    <Badge className={
                      new Date(contract.end_date) < new Date() ? 'bg-gray-100 text-gray-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {new Date(contract.end_date) < new Date() ? 'Beendet' : 'Aktiv'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-600">Startdatum</p>
                      <p className="font-semibold">{new Date(contract.start_date).toLocaleDateString('de-DE')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Enddatum</p>
                      <p className="font-semibold">{new Date(contract.end_date).toLocaleDateString('de-DE')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Miete monatlich</p>
                      <p className="font-semibold">{(contract.monthly_rent || 0).toLocaleString('de-DE')}€</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Kaution</p>
                      <p className="font-semibold">{(contract.deposit || 0).toLocaleString('de-DE')}€</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-2">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="pt-4 text-center text-slate-600">
                Keine Zahlungen vorhanden
              </CardContent>
            </Card>
          ) : (
            payments.map(payment => (
              <Card key={payment.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{(payment.amount || 0).toLocaleString('de-DE')}€</p>
                      <p className="text-xs text-slate-600">{new Date(payment.payment_date).toLocaleDateString('de-DE')}</p>
                    </div>
                    <Badge className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {payment.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Maintenance Requests Tab */}
        <TabsContent value="maintenance" className="space-y-3">
          {maintenanceRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-4 text-center text-slate-600">
                Keine Anfragen vorhanden
              </CardContent>
            </Card>
          ) : (
            maintenanceRequests.map(req => (
              <Card key={req.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{req.title}</CardTitle>
                    <Badge className={
                      req.status === 'completed' ? 'bg-green-100 text-green-800' :
                      req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-slate-600">{req.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(req.created_at).toLocaleDateString('de-DE')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-2">
          {communications.length === 0 ? (
            <Card>
              <CardContent className="pt-4 text-center text-slate-600">
                Keine Nachrichten vorhanden
              </CardContent>
            </Card>
          ) : (
            communications.map(msg => (
              <Card key={msg.id}>
                <CardContent className="pt-4">
                  <p className="font-semibold text-sm">{msg.subject}</p>
                  <p className="text-xs text-slate-600 mt-1">{msg.message_text}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(msg.created_at).toLocaleDateString('de-DE')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-2">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="pt-4 text-center text-slate-600">
                Keine Dokumente vorhanden
              </CardContent>
            </Card>
          ) : (
            documents.map(doc => (
              <Card key={doc.id}>
                <CardContent className="pt-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{doc.document_name}</p>
                    <p className="text-xs text-slate-600">{new Date(doc.created_at).toLocaleDateString('de-DE')}</p>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-semibold"
                  >
                    Download
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}