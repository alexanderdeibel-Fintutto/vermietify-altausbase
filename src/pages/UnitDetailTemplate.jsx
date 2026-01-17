import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDetailPage, VfDetailSidebar } from '@/components/detail-pages/VfDetailPage';
import { VfQuickActions } from '@/components/dashboards/VfDashboard';
import { VfActivityFeed } from '@/components/activity/VfActivityFeed';
import { Home, LayoutDashboard, FileText, Users, Euro, FolderOpen, History, Plus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfDataGrid } from '@/components/data-display/VfDataGrid';
import { VfDataField } from '@/components/data-display/VfDataField';

export default function UnitDetailTemplate() {
  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('id');
  
  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => base44.entities.Unit.get(unitId),
    enabled: !!unitId
  });

  const { data: building } = useQuery({
    queryKey: ['building', unit?.building_id],
    queryFn: () => base44.entities.Building.get(unit.building_id),
    enabled: !!unit?.building_id
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', unitId],
    queryFn: () => base44.entities.LeaseContract.filter({ unit_id: unitId }),
    enabled: !!unitId
  });

  if (isLoading || !unit) {
    return <div>Laden...</div>;
  }

  const activeContract = contracts.find(c => c.status === 'aktiv');

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard, content: <OverviewTab unit={unit} building={building} /> },
    { id: 'contract', label: 'Mietvertrag', icon: FileText, content: <div>Mietvertrag</div> },
    { id: 'finances', label: 'Finanzen', icon: Euro, content: <div>Finanzen</div> },
    { id: 'documents', label: 'Dokumente', icon: FolderOpen, content: <div>Dokumente</div> },
    { id: 'history', label: 'Historie', icon: History, content: <div>Historie</div> }
  ];

  return (
    <VfDetailPage
      backLink={{
        label: 'Zum Objekt',
        href: createPageUrl('BuildingDetail') + `?id=${unit.building_id}`
      }}
      icon={Home}
      title={unit.unit_number}
      subtitle={`${building?.name || ''} • ${unit.sqm} m² • ${unit.rooms} Zimmer`}
      stats={[
        { label: 'Fläche', value: `${unit.sqm} m²` },
        { label: 'Zimmer', value: unit.rooms },
        { label: 'Status', value: unit.status },
        { label: 'Miete', value: activeContract ? `${activeContract.total_rent} €` : '-' }
      ]}
      tabs={tabs}
      defaultTab="overview"
      sidebar={
        <VfDetailSidebar
          sections={[
            {
              title: 'Quick Actions',
              content: (
                <VfQuickActions
                  actions={[
                    { label: '+ Vertrag', icon: Plus, onClick: () => {} },
                    { label: '+ Dokument', icon: FolderOpen, onClick: () => {} }
                  ]}
                />
              )
            },
            {
              title: 'Aktueller Mieter',
              content: activeContract ? (
                <div className="vf-contact-card">
                  <div className="vf-contact-card__name">Max Mustermann</div>
                  <div className="vf-contact-card__detail">Seit 01.02.2020</div>
                </div>
              ) : (
                <p className="text-sm text-[var(--theme-text-muted)]">Keine aktive Vermietung</p>
              )
            }
          ]}
        />
      }
    />
  );
}

function OverviewTab({ unit, building }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Einheitsdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <VfDataGrid columns={2}>
            <VfDataField label="Einheit" value={unit.unit_number} />
            <VfDataField label="Etage" value={unit.floor || '-'} />
            <VfDataField label="Wohnfläche" value={`${unit.sqm} m²`} />
            <VfDataField label="Zimmer" value={unit.rooms} />
            <VfDataField label="Status" value={unit.status} />
            <VfDataField label="Typ" value={unit.unit_type || 'Wohnung'} />
          </VfDataGrid>
        </CardContent>
      </Card>
    </div>
  );
}