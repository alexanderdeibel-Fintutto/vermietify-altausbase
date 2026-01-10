import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText, Home } from 'lucide-react';
import BuildingPhotoGallery from '@/components/buildings/BuildingPhotoGallery';
import BuildingFloorPlan from '@/components/buildings/BuildingFloorPlan';
import BuildingInventory from '@/components/buildings/BuildingInventory';
import MaintenanceHistory from '@/components/buildings/MaintenanceHistory';
import RecurringMaintenancePlanner from '@/components/buildings/RecurringMaintenancePlanner';

export default function BuildingDetailEnhanced() {
  const { buildingId } = useParams();
  const queryClient = useQueryClient();

  const { data: building, isLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => base44.entities.Building.filter({ id: buildingId }).then(results => results[0])
  });

  if (isLoading) return <div className="p-6">Wird geladen...</div>;
  if (!building) return <div className="p-6">Gebäude nicht gefunden</div>;

  const handleFloorPlanUpdate = async (updatedPlans) => {
    await base44.entities.Building.update(buildingId, { floor_plans: updatedPlans });
    queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
  };

  const handleInventoryUpdate = async (updatedInventory) => {
    await base44.entities.Building.update(buildingId, { inventory: updatedInventory });
    queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-8 h-8 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-900">{building.name}</h1>
        </div>
        <p className="text-slate-600 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {building.address}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Einheiten</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{building.units_count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Baujahr</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{building.year_built || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamtfläche</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{building.total_area || 0} m²</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Energieeffizienz</p>
            <Badge className="mt-2 bg-green-100 text-green-700">{building.energy_rating || 'N/A'}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="floorplans">Grundrisse</TabsTrigger>
          <TabsTrigger value="inventory">Inventar</TabsTrigger>
          <TabsTrigger value="maintenance">Wartung</TabsTrigger>
          <TabsTrigger value="recurring">Regelmäßig</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="space-y-6">
          <BuildingPhotoGallery
            buildingId={buildingId}
            photos={building.photos || []}
          />
        </TabsContent>

        <TabsContent value="floorplans" className="space-y-6">
          <BuildingFloorPlan
            buildingId={buildingId}
            floorPlans={building.floor_plans || []}
            onUpdate={handleFloorPlanUpdate}
          />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <BuildingInventory
            buildingId={buildingId}
            inventory={building.inventory || []}
            onUpdate={handleInventoryUpdate}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceHistory buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-6">
          <RecurringMaintenancePlanner buildingId={buildingId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}