import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDetailPage, VfDetailSidebar } from '@/components/detail-pages/VfDetailPage';
import { VfActivityFeed } from '@/components/activity/VfActivityFeed';
import { User, LayoutDashboard, FileText, Euro, MessageSquare } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfDataGrid } from '@/components/data-display/VfDataGrid';
import { VfDataField } from '@/components/data-display/VfDataField';
import { Button } from '@/components/ui/button';

export default function TenantDetailTemplate() {
  const params = new URLSearchParams(window.location.search);
  const tenantId = params.get('id');
  
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => base44.entities.Tenant.get(tenantId),
    enabled: !!tenantId
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenant-contracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }),
    enabled: !!tenantId
  });

  if (isLoading || !tenant) {
    return <div>Laden...</div>;
  }

  const activeContract = contracts.find(c => c.status === 'aktiv');

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard, content: <OverviewTab tenant={tenant} /> },
    { id: 'contracts', label: 'Verträge', icon: FileText, badge: contracts.length, content: <div>Verträge</div> },
    { id: 'payments', label: 'Zahlungen', icon: Euro, content: <div>Zahlungen</div> },
    { id: 'documents', label: 'Dokumente', icon: FileText, content: <div>Dokumente</div> },
    { id: 'communication', label: 'Kommunikation', icon: MessageSquare, content: <div>Kommunikation</div> }
  ];

  const tenantSince = activeContract?.contract_start 
    ? new Date(activeContract.contract_start).toLocaleDateString('de-DE')
    : '-';

  return (
    <VfDetailPage
      backLink={{
        label: 'Zu allen Mietern',
        href: createPageUrl('Tenants')
      }}
      icon={User}
      title={`${tenant.first_name} ${tenant.last_name}`}
      subtitle={`Mieter seit ${tenantSince}`}
      stats={[
        { label: 'Verträge', value: contracts.length },
        { label: 'Status', value: activeContract ? 'Aktiv' : 'Inaktiv' },
        { label: 'Zahlungsstatus', value: 'Aktuell' }
      ]}
      tabs={tabs}
      defaultTab="overview"
      sidebar={
        <VfDetailSidebar
          sections={[
            {
              title: 'Kontakt',
              content: (
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="text-[var(--theme-text-muted)]">E-Mail</div>
                    <div className="font-medium">{tenant.email || '-'}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-[var(--theme-text-muted)]">Telefon</div>
                    <div className="font-medium">{tenant.phone || '-'}</div>
                  </div>
                  <Button variant="primary" className="w-full mt-3">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Nachricht senden
                  </Button>
                </div>
              )
            },
            {
              title: 'Letzte Aktivität',
              content: <VfActivityFeed entityType="Tenant" entityId={tenantId} limit={5} groupByDay={false} />
            }
          ]}
        />
      }
    />
  );
}

function OverviewTab({ tenant }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mieterdaten</CardTitle>
      </CardHeader>
      <CardContent>
        <VfDataGrid columns={2}>
          <VfDataField label="Vorname" value={tenant.first_name} />
          <VfDataField label="Nachname" value={tenant.last_name} />
          <VfDataField label="E-Mail" value={tenant.email} />
          <VfDataField label="Telefon" value={tenant.phone} />
          <VfDataField label="Geburtsdatum" value={tenant.birth_date || '-'} />
          <VfDataField label="Staatsangehörigkeit" value={tenant.nationality || '-'} />
        </VfDataGrid>
      </CardContent>
    </Card>
  );
}