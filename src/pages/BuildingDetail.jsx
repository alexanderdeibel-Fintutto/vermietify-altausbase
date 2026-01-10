import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, MapPin, Users, FileText, ClipboardList, 
  Building2, MessageSquare, Home, Wrench 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BuildingUnitsManager from '@/components/building-detail/BuildingUnitsManager';
import BuildingTenantsOverview from '@/components/building-detail/BuildingTenantsOverview';
import BuildingContractsOverview from '@/components/building-detail/BuildingContractsOverview';
import BuildingDocumentsOverview from '@/components/building-detail/BuildingDocumentsOverview';
import BuildingBoardOverview from '@/components/building-detail/BuildingBoardOverview';
import BuildingTasksManager from '@/components/building-detail/BuildingTasksManager';
import BuildingInfoPanel from '@/components/building-detail/BuildingInfoPanel';
import IoTSensorsPanel from '@/components/building-detail/IoTSensorsPanel';
import InteractiveBuildingMap from '@/components/building-detail/InteractiveBuildingMap';
import MaintenanceCalendarView from '@/components/maintenance/MaintenanceCalendarView';

export default function BuildingDetailPage() {
  const buildingId = new URLSearchParams(window.location.search).get('id');

  const { data: building, isLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const buildings = await base44.entities.Building.filter({ id: buildingId }, null, 1);
      return buildings[0];
    },
    enabled: !!buildingId
  });

  const { data: units = [] } = useQuery({
    queryKey: ['buildingUnits', buildingId],
    queryFn: () => base44.entities.Unit.filter({ gebaeude_id: buildingId }, null, 100),
    enabled: !!buildingId
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['buildingContracts', buildingId],
    queryFn: () => base44.entities.LeaseContract.filter({ building_id: buildingId }, '-start_date', 100),
    enabled: !!buildingId
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['buildingTenants', buildingId],
    queryFn: async () => {
      const tenantIds = [...new Set(contracts.map(c => c.tenant_id))];
      if (tenantIds.length === 0) return [];
      const allTenants = await base44.entities.Tenant.list(null, 200);
      return allTenants.filter(t => tenantIds.includes(t.id));
    },
    enabled: contracts.length > 0
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Wird geladen...</div>;
  }

  if (!building) {
    return <div className="text-center p-6">Gebäude nicht gefunden</div>;
  }

  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Buildings')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-light text-slate-900">{building.name}</h1>
          <p className="text-slate-600 flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4" />
            {building.address}, {building.postal_code} {building.city}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{units.length}</p>
                <p className="text-sm text-slate-600">Einheiten</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{occupiedUnits}</p>
                <p className="text-sm text-slate-600">Belegt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{vacantUnits}</p>
                <p className="text-sm text-slate-600">Frei</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{activeContracts}</p>
                <p className="text-sm text-slate-600">Verträge</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="iot-map">IoT-Karte</TabsTrigger>
          <TabsTrigger value="units">Einheiten</TabsTrigger>
          <TabsTrigger value="tenants">Mieter</TabsTrigger>
          <TabsTrigger value="contracts">Verträge</TabsTrigger>
          <TabsTrigger value="board">Pinnwand</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="tasks">Aufgaben</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BuildingInfoPanel building={building} />
            <IoTSensorsPanel buildingId={buildingId} />
          </div>
        </TabsContent>

        <TabsContent value="iot-map">
          <InteractiveBuildingMap buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="units">
          <BuildingUnitsManager buildingId={buildingId} units={units} />
        </TabsContent>

        <TabsContent value="tenants">
          <BuildingTenantsOverview buildingId={buildingId} tenants={tenants} contracts={contracts} />
        </TabsContent>

        <TabsContent value="contracts">
          <BuildingContractsOverview buildingId={buildingId} contracts={contracts} />
        </TabsContent>

        <TabsContent value="board">
          <BuildingBoardOverview buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="documents">
          <BuildingDocumentsOverview buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="tasks">
          <div className="space-y-6">
            <MaintenanceCalendarView buildingId={buildingId} />
            <BuildingTasksManager buildingId={buildingId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}