import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDetailPage, VfDetailSidebar } from '@/components/detail-pages/VfDetailPage';
import { VfQuickActions } from '@/components/dashboards/VfDashboard';
import { VfActivityFeed } from '@/components/activity/VfActivityFeed';
import { Building2, LayoutDashboard, Home, Users, FileText, Euro, FolderOpen, CheckSquare, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfDataGrid } from '@/components/data-display/VfDataGrid';
import { VfDataField } from '@/components/data-display/VfDataField';

export default function BuildingDetailTemplate() {
  const params = new URLSearchParams(window.location.search);
  const buildingId = params.get('id');
  
  const { data: building, isLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => base44.entities.Building.get(buildingId),
    enabled: !!buildingId
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => base44.entities.Unit.filter({ building_id: buildingId }),
    enabled: !!buildingId
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', buildingId],
    queryFn: async () => {
      const allContracts = await base44.entities.LeaseContract.list();
      return allContracts.filter(c => 
        units.some(u => u.id === c.unit_id)
      );
    },
    enabled: units.length > 0
  });

  if (isLoading || !building) {
    return <div>Laden...</div>;
  }

  const occupiedUnits = units.filter(u => u.status === 'vermietet').length;
  const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;
  const totalRent = contracts.reduce((sum, c) => sum + (c.total_rent || 0), 0);

  const tabs = [
    {
      id: 'overview',
      label: 'Übersicht',
      icon: LayoutDashboard,
      content: <OverviewTab building={building} units={units} />
    },
    {
      id: 'units',
      label: 'Einheiten',
      icon: Home,
      badge: units.length,
      content: <UnitsTab units={units} buildingId={buildingId} />
    },
    {
      id: 'tenants',
      label: 'Mieter',
      icon: Users,
      badge: contracts.filter(c => c.status === 'aktiv').length,
      content: <div>Mieter-Übersicht</div>
    },
    {
      id: 'contracts',
      label: 'Verträge',
      icon: FileText,
      badge: contracts.length,
      content: <div>Verträge</div>
    },
    {
      id: 'finances',
      label: 'Finanzen',
      icon: Euro,
      content: <div>Finanzen</div>
    },
    {
      id: 'documents',
      label: 'Dokumente',
      icon: FolderOpen,
      content: <div>Dokumente</div>
    }
  ];

  return (
    <VfDetailPage
      backLink={{
        label: 'Zu allen Objekten',
        href: createPageUrl('Buildings')
      }}
      icon={Building2}
      title={building.name}
      subtitle={`${building.city || ''} ${building.postal_code || ''} • ${building.building_type || 'Wohngebäude'}`}
      stats={[
        { label: 'Einheiten', value: units.length },
        { label: 'Vermietet', value: `${Math.round(occupancyRate)}%` },
        { label: 'Monatsmiete', value: `${totalRent.toLocaleString('de-DE')} €` },
        { label: 'Baujahr', value: building.year_built || '-' }
      ]}
      tabs={tabs}
      defaultTab="overview"
      primaryAction={{
        label: 'Bearbeiten',
        icon: Edit,
        onClick: () => console.log('Edit building')
      }}
      secondaryActions={[
        { label: 'Duplizieren', icon: Plus, onClick: () => {} },
        { label: 'Exportieren', icon: FileText, onClick: () => {} },
        { label: 'Löschen', icon: Trash2, onClick: () => {}, destructive: true }
      ]}
      sidebar={
        <VfDetailSidebar
          sections={[
            {
              title: 'Quick Actions',
              content: (
                <VfQuickActions
                  actions={[
                    { label: '+ Einheit', icon: Plus, onClick: () => {} },
                    { label: '+ Vertrag', icon: FileText, onClick: () => {} },
                    { label: '+ Dokument', icon: FolderOpen, onClick: () => {} }
                  ]}
                />
              )
            },
            {
              title: 'Letzte Aktivität',
              content: <VfActivityFeed entityType="Building" entityId={buildingId} limit={5} groupByDay={false} />
            }
          ]}
        />
      }
    />
  );
}

function OverviewTab({ building, units }) {
  return (
    <div className="vf-building-overview">
      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <VfDataGrid columns={2}>
            <VfDataField label="Name" value={building.name} />
            <VfDataField label="Adresse" value={building.address} />
            <VfDataField label="Stadt" value={building.city} />
            <VfDataField label="PLZ" value={building.postal_code} />
            <VfDataField label="Gebäudetyp" value={building.building_type} />
            <VfDataField label="Baujahr" value={building.year_built} />
            <VfDataField label="Gesamtfläche" value={`${building.total_area || 0} m²`} />
            <VfDataField label="Grundstücksfläche" value={`${building.land_area || 0} m²`} />
          </VfDataGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steuerdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <VfDataGrid columns={2}>
            <VfDataField label="Kaufdatum" value={building.purchase_date || '-'} />
            <VfDataField label="Kaufpreis" value={building.purchase_price ? `${building.purchase_price.toLocaleString('de-DE')} €` : '-'} />
            <VfDataField label="Grundstückswert" value={building.land_value ? `${building.land_value.toLocaleString('de-DE')} €` : '-'} />
            <VfDataField label="Gebäudewert" value={building.building_value ? `${building.building_value.toLocaleString('de-DE')} €` : '-'} />
            <VfDataField label="AfA-Typ" value={building.afa_type || '-'} />
            <VfDataField label="AfA-Satz" value={building.afa_rate ? `${building.afa_rate}%` : '-'} />
          </VfDataGrid>
        </CardContent>
      </Card>
    </div>
  );
}

function UnitsTab({ units, buildingId }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Einheiten ({units.length})</h3>
        <Button variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Neue Einheit
        </Button>
      </div>
      
      <div className="space-y-3">
        {units.map((unit) => (
          <Card key={unit.id} className="vf-card-clickable">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{unit.unit_number}</div>
                  <div className="text-sm text-[var(--theme-text-secondary)]">
                    {unit.sqm} m² • {unit.rooms} Zimmer
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "vf-badge",
                    unit.status === 'vermietet' ? "vf-badge-success" : "vf-badge-warning"
                  )}>
                    {unit.status}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}