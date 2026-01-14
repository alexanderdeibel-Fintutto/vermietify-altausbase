import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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
import BuildingDocumentsManager from '@/components/building-detail/BuildingDocumentsManager';
import BuildingMaintenanceOverview from '@/components/building-detail/BuildingMaintenanceOverview';
import BuildingOwnershipManager from '@/components/buildings/BuildingOwnershipManager';
import BuildingFinanceTab from '@/components/buildings/BuildingFinanceTab';
import BuildingStammdatenTab from '@/components/buildings/BuildingStammdatenTab';
import BuildingTechnicalTab from '@/components/buildings/BuildingTechnicalTab';
import BuildingTaxTab from '@/components/buildings/BuildingTaxTab';
import ErrorBoundaryWithRetry from '@/components/shared/ErrorBoundaryWithRetry';
import EnergyPassportPanel from '@/components/building-detail/EnergyPassportPanel';
import BuildingTransfersOverview from '@/components/building-detail/BuildingTransfersOverview';
import QuickContractCreator from '@/components/contracts/QuickContractCreator';
import AutoCreateUnitsDialog from '@/components/units/AutoCreateUnitsDialog';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';

export default function BuildingDetailPage() {

  const [contractCreatorOpen, setContractCreatorOpen] = React.useState(false);
  const [autoCreateUnitsOpen, setAutoCreateUnitsOpen] = React.useState(false);
  const buildingId = new URLSearchParams(window.location.search).get('id');

  const { data: currentUser } = useQuery({ 
      queryKey: ['currentUser'], 
      queryFn: () => base44.auth.me() 
  });

  const { data: building, isLoading: isLoadingBuilding } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const buildings = await base44.entities.Building.filter({ id: buildingId }, null, 1);
      return buildings[0];
    },
    enabled: !!buildingId
  });

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
      queryKey: ['buildingPermission', buildingId, currentUser?.email],
      queryFn: () => base44.entities.BuildingPermission.filter({ building_id: buildingId, user_email: currentUser.email }),
      enabled: !!buildingId && !!currentUser && currentUser.role !== 'admin'
  });

  const permissionLevel = useMemo(() => {
      if (!currentUser) return 'none';
      if (currentUser.role === 'admin') return 'write';
      if (!permissions?.length) return 'none';
      return permissions[0].permission_level;
  }, [currentUser, permissions]);

  const hasReadAccess = permissionLevel === 'read' || permissionLevel === 'write';

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

  const isLoading = isLoadingBuilding || (!!currentUser && currentUser.role !== 'admin' && isLoadingPermissions);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Wird geladen...</div>;
  }

  if (!building) {
    return <div className="text-center p-6">Gebäude nicht gefunden</div>;
  }

  if (!hasReadAccess) {
    return (
        <div className="text-center p-6">
            <h1 className="text-xl font-semibold">Zugriff verweigert</h1>
            <p className="text-slate-600">Sie haben keine Berechtigung, auf dieses Gebäude zuzugreifen.</p>
            <Link to={createPageUrl('Buildings')}>
                <Button variant="outline" className="mt-4">Zurück zur Übersicht</Button>
            </Link>
        </div>
    )
  }

  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  return (
    <ErrorBoundaryWithRetry>
    <div className="space-y-6">
      <BreadcrumbNavigation items={[
          { label: 'Gebäude', href: createPageUrl('Buildings') },
          { label: building.name }
      ]} />

      {/* Header */}
      <div className="flex items-center gap-4">
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
        <TabsList className="grid grid-cols-6 lg:grid-cols-12 w-full">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
          <TabsTrigger value="technical">Technik</TabsTrigger>
          <TabsTrigger value="tax">Steuer</TabsTrigger>
          <TabsTrigger value="finance">Finanzen</TabsTrigger>
          <TabsTrigger value="units">Einheiten</TabsTrigger>
          <TabsTrigger value="owners">Eigentümer</TabsTrigger>
          <TabsTrigger value="tenants">Mieter</TabsTrigger>
          <TabsTrigger value="contracts">Verträge</TabsTrigger>
          <TabsTrigger value="board">Pinnwand</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="tasks">Aufgaben</TabsTrigger>
          <TabsTrigger value="transfers">Überweisungen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BuildingInfoPanel building={building} permissionLevel={permissionLevel} />
            <BuildingMaintenanceOverview buildingId={buildingId} />
            <EnergyPassportPanel buildingId={buildingId} />
          </div>
          <BuildingDocumentsManager buildingId={buildingId} />
          <IoTSensorsPanel buildingId={buildingId} permissionLevel={permissionLevel} />
        </TabsContent>

        <TabsContent value="stammdaten">
          <BuildingStammdatenTab building={building} />
        </TabsContent>

        <TabsContent value="technical">
          <BuildingTechnicalTab building={building} />
        </TabsContent>

        <TabsContent value="tax">
          <BuildingTaxTab building={building} />
        </TabsContent>

        <TabsContent value="finance">
          <BuildingFinanceTab buildingId={buildingId} building={building} />
        </TabsContent>

        <TabsContent value="owners">
          <BuildingOwnershipManager buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="units">
          <div className="space-y-4">
            <Button onClick={() => setAutoCreateUnitsOpen(true)} className="bg-blue-600">+ Automatisch Einheiten erstellen</Button>
            <BuildingUnitsManager buildingId={buildingId} units={units} permissionLevel={permissionLevel} />
          </div>
        </TabsContent>

        <TabsContent value="tenants">
          <BuildingTenantsOverview buildingId={buildingId} tenants={tenants} contracts={contracts} />
        </TabsContent>

        <TabsContent value="contracts">
          <div className="space-y-4">
            <Button onClick={() => setContractCreatorOpen(true)} className="bg-emerald-600">
              + Neuer Mietvertrag
            </Button>
            <BuildingContractsOverview buildingId={buildingId} contracts={contracts} />
          </div>
        </TabsContent>

        <TabsContent value="board">
          <BuildingBoardOverview buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BuildingDocumentsManager buildingId={buildingId} permissionLevel={permissionLevel} />
            <BuildingDocumentsOverview buildingId={buildingId} />
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="space-y-6">
            <MaintenanceCalendarView buildingId={buildingId} />
            <BuildingTasksManager buildingId={buildingId} permissionLevel={permissionLevel} />
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Überweisungen für dieses Gebäude</CardTitle>
                <Button onClick={() => window.location.href = createPageUrl('BankTransfers')} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Alle Überweisungen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BuildingTransfersOverview buildingId={buildingId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <QuickContractCreator 
        open={contractCreatorOpen}
        onOpenChange={setContractCreatorOpen}
      />
      
      <AutoCreateUnitsDialog
        buildingId={buildingId}
        open={autoCreateUnitsOpen}
        onOpenChange={setAutoCreateUnitsOpen}
      />
    </div>
    </ErrorBoundaryWithRetry>
  );
}