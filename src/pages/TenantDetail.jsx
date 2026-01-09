import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import ContractsList from '@/components/tenant-detail/ContractsList';
import PaymentsList from '@/components/tenant-detail/PaymentsList';
import CommunicationsList from '@/components/tenant-detail/CommunicationsList';

export default function TenantDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tenantId = searchParams.get('id');

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => base44.entities.Tenant.filter({ id: tenantId }, null, 1).then(r => r[0]),
    enabled: !!tenantId
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenant-contracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }),
    enabled: !!tenantId
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', tenantId],
    queryFn: () => base44.entities.Payment.filter({ tenant_id: tenantId }, '-created_date'),
    enabled: !!tenantId
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['tenant-communications', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter({ tenant_id: tenantId }, '-created_date'),
    enabled: !!tenantId
  });

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        <p className="text-slate-600">Mieter nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </Button>

      {/* Header Card */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                {tenant.full_name?.charAt(0) || 'M'}
              </div>
              <div>
                <h1 className="text-3xl font-light text-slate-900">{tenant.full_name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {tenant.email}
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {tenant.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge
                variant={tenant.status === 'active' ? 'default' : 'outline'}
                className={tenant.status === 'active' ? 'bg-green-100 text-green-800' : ''}
              >
                {tenant.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              </Badge>
              <Badge
                variant={tenant.portal_enabled ? 'default' : 'outline'}
                className={tenant.portal_enabled ? 'bg-blue-100 text-blue-800' : ''}
              >
                {tenant.portal_enabled ? 'Portal: Aktiv' : 'Portal: Inaktiv'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Registriert am</p>
            <p className="text-sm font-semibold text-slate-900">
              {tenant.created_date ? new Date(tenant.created_date).toLocaleDateString('de-DE') : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Aktive Verträge</p>
            <p className="text-sm font-semibold text-slate-900">
              {contracts.filter(c => c.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Zahlungen (30 Tage)</p>
            <p className="text-sm font-semibold text-green-600">
              {payments.filter(p => {
                const days = (Date.now() - new Date(p.created_date)) / (1000 * 60 * 60 * 24);
                return days <= 30;
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Nachrichten</p>
            <p className="text-sm font-semibold text-slate-900">
              {communications.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contracts" className="w-full">
        <TabsList>
          <TabsTrigger value="contracts">Verträge ({contracts.length})</TabsTrigger>
          <TabsTrigger value="payments">Zahlungen ({payments.length})</TabsTrigger>
          <TabsTrigger value="communications">Kommunikation ({communications.length})</TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <ContractsList contracts={contracts} />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <PaymentsList payments={payments} />
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <CommunicationsList communications={communications} />
        </TabsContent>
      </Tabs>
    </div>
  );
}