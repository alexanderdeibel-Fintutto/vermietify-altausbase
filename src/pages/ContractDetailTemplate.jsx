import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDetailPage, VfDetailSidebar } from '@/components/detail-pages/VfDetailPage';
import { FileText, LayoutDashboard, Euro, TrendingUp } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfDataGrid } from '@/components/data-display/VfDataGrid';
import { VfDataField } from '@/components/data-display/VfDataField';

export default function ContractDetailTemplate() {
  const params = new URLSearchParams(window.location.search);
  const contractId = params.get('id');
  
  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => base44.entities.LeaseContract.get(contractId),
    enabled: !!contractId
  });

  const { data: unit } = useQuery({
    queryKey: ['unit', contract?.unit_id],
    queryFn: () => base44.entities.Unit.get(contract.unit_id),
    enabled: !!contract?.unit_id
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', contract?.tenant_id],
    queryFn: () => base44.entities.Tenant.get(contract.tenant_id),
    enabled: !!contract?.tenant_id
  });

  if (isLoading || !contract) {
    return <div>Laden...</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Vertragsdaten', icon: LayoutDashboard, content: <OverviewTab contract={contract} /> },
    { id: 'rent', label: 'Miete & Nebenkosten', icon: Euro, content: <RentTab contract={contract} /> },
    { id: 'adjustments', label: 'Anpassungen', icon: TrendingUp, content: <div>Anpassungen</div> },
    { id: 'documents', label: 'Dokumente', icon: FileText, content: <div>Dokumente</div> }
  ];

  return (
    <VfDetailPage
      backLink={{
        label: 'Zu allen Verträgen',
        href: createPageUrl('Contracts')
      }}
      icon={FileText}
      title={`Mietvertrag ${contract.contract_number || contract.id.substring(0, 8)}`}
      subtitle={`${tenant?.first_name} ${tenant?.last_name} • ${unit?.unit_number || ''}`}
      stats={[
        { label: 'Status', value: contract.status },
        { label: 'Seit', value: contract.contract_start ? new Date(contract.contract_start).toLocaleDateString('de-DE') : '-' },
        { label: 'Miete', value: `${contract.total_rent || 0} €` }
      ]}
      tabs={tabs}
      defaultTab="overview"
      sidebar={
        <VfDetailSidebar
          sections={[
            {
              title: 'Mieter',
              content: tenant ? (
                <div className="vf-contact-card">
                  <div className="vf-contact-card__name">
                    {tenant.first_name} {tenant.last_name}
                  </div>
                  <div className="vf-contact-card__detail">{tenant.email}</div>
                  <div className="vf-contact-card__detail">{tenant.phone}</div>
                </div>
              ) : null
            }
          ]}
        />
      }
    />
  );
}

function OverviewTab({ contract }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vertragsdaten</CardTitle>
      </CardHeader>
      <CardContent>
        <VfDataGrid columns={2}>
          <VfDataField label="Vertragsnummer" value={contract.contract_number || '-'} />
          <VfDataField label="Status" value={contract.status} />
          <VfDataField label="Vertragsbeginn" value={contract.contract_start ? new Date(contract.contract_start).toLocaleDateString('de-DE') : '-'} />
          <VfDataField label="Vertragsende" value={contract.contract_end ? new Date(contract.contract_end).toLocaleDateString('de-DE') : 'Unbefristet'} />
          <VfDataField label="Kündigungsfrist" value={`${contract.notice_period_months || 3} Monate`} />
        </VfDataGrid>
      </CardContent>
    </Card>
  );
}

function RentTab({ contract }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Miete & Nebenkosten</CardTitle>
      </CardHeader>
      <CardContent>
        <VfDataGrid columns={2}>
          <VfDataField label="Kaltmiete" value={`${contract.base_rent || 0} €`} />
          <VfDataField label="Nebenkosten" value={`${contract.operating_costs || 0} €`} />
          <VfDataField label="Heizkosten" value={`${contract.heating_costs || 0} €`} />
          <VfDataField label="Warmmiete gesamt" value={`${contract.total_rent || 0} €`} />
          <VfDataField label="€/m²" value={contract.sqm ? `${(contract.base_rent / contract.sqm).toFixed(2)} €` : '-'} />
        </VfDataGrid>
      </CardContent>
    </Card>
  );
}