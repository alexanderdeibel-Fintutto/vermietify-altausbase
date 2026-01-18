import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, Link } from 'react-router-dom';
import { Building, Home, Users, FileText, Euro, CheckSquare, Settings, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BuildingSummary from '@/components/buildings/BuildingSummary';
import BuildingUnitsManager from '@/components/building-detail/BuildingUnitsManager';
import BuildingTenantsOverview from '@/components/building-detail/BuildingTenantsOverview';
import BuildingContractsOverview from '@/components/building-detail/BuildingContractsOverview';
import BuildingDocumentsManager from '@/components/building-detail/BuildingDocumentsManager';
import BuildingTasksManager from '@/components/building-detail/BuildingTasksManager';
import BuildingPhotoGallery from '@/components/buildings/BuildingPhotoGallery';
import MaintenanceHistory from '@/components/buildings/MaintenanceHistory';

export default function BuildingDetailEnhanced() {
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: building } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => base44.entities.Building.get(buildingId),
    enabled: !!buildingId
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => base44.entities.Unit.filter({ building_id: buildingId })
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', buildingId],
    queryFn: async () => {
      const allContracts = await base44.entities.LeaseContract.list();
      return allContracts.filter(c => units.some(u => u.id === c.unit_id));
    },
    enabled: units.length > 0
  });

  if (!building) return <div>Laden...</div>;

  const stats = [
    { label: 'Einheiten', value: units.length },
    { label: 'Vermietet', value: `${Math.round((units.length > 0 ? (contracts.filter(c => c.status === 'Aktiv').length / units.length) * 100 : 0))}%` },
    { label: 'Monatsmiete', value: `€${contracts.filter(c => c.status === 'Aktiv').reduce((sum, c) => sum + (c.kaltmiete || 0), 0).toLocaleString('de-DE')}` }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <div className="vf-detail-header">
        <Link to="/buildings" className="vf-detail-header__back">
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Objekten
        </Link>

        <div className="vf-detail-header__top">
          <div className="flex items-start gap-4 flex-1">
            <div className="vf-detail-header__icon">
              <Building className="h-7 w-7" />
            </div>
            <div className="vf-detail-header__info">
              <h1 className="vf-detail-header__title">{building.adresse}</h1>
              <p className="vf-detail-header__subtitle">
                {building.plz} {building.ort} • {building.gebaeude_typ || 'Mehrfamilienhaus'}
              </p>
            </div>
          </div>
        </div>

        <div className="vf-detail-header__stats">
          {stats.map((stat, index) => (
            <div key={index} className="vf-detail-stat">
              <div className="vf-detail-stat__value">{stat.value}</div>
              <div className="vf-detail-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="vf-detail-tabs">
        <TabsList className="vf-detail-tabs">
          <TabsTrigger value="overview" className="vf-detail-tabs__tab">
            <Home className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="units" className="vf-detail-tabs__tab">
            <Building className="h-4 w-4" />
            Einheiten
            <span className="vf-detail-tabs__badge">{units.length}</span>
          </TabsTrigger>
          <TabsTrigger value="tenants" className="vf-detail-tabs__tab">
            <Users className="h-4 w-4" />
            Mieter
          </TabsTrigger>
          <TabsTrigger value="contracts" className="vf-detail-tabs__tab">
            <FileText className="h-4 w-4" />
            Verträge
          </TabsTrigger>
          <TabsTrigger value="documents" className="vf-detail-tabs__tab">
            <FileText className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
        </TabsList>

        <div className="vf-detail-main">
          <TabsContent value="overview">
            <div className="vf-building-overview">
              <BuildingSummary building={building} units={units} />
              <BuildingPhotoGallery buildingId={buildingId} />
              <MaintenanceHistory buildingId={buildingId} />
            </div>
          </TabsContent>

          <TabsContent value="units">
            <BuildingUnitsManager buildingId={buildingId} units={units} />
          </TabsContent>

          <TabsContent value="tenants">
            <BuildingTenantsOverview buildingId={buildingId} />
          </TabsContent>

          <TabsContent value="contracts">
            <BuildingContractsOverview buildingId={buildingId} />
          </TabsContent>

          <TabsContent value="documents">
            <BuildingDocumentsManager buildingId={buildingId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}