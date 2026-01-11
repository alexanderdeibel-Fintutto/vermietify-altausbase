import React, { useState, useMemo } from 'react';
import { useBuildingStats } from '@/components/buildings/useBuildingStats';
import { useQuery } from '@tanstack/react-query';
import BuildingFilterBar from '@/components/buildings/BuildingFilterBar';
import BuildingTable from '@/components/buildings/BuildingTable';
import BuildingSummary from '@/components/buildings/BuildingSummary';
import BuildingEditDialog from '@/components/buildings/BuildingEditDialog';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/components/buildings/DeleteConfirmDialog';
import LimitGuard from '@/components/package/LimitGuard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BuildingsPage() {
  const [filters, setFilters] = useState({ status: 'all', city: 'all', search: '' });
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: buildingStats, isLoading: isLoadingStats } = useBuildingStats();

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
      queryKey: ['buildingPermissions', currentUser?.email],
      queryFn: () => base44.entities.BuildingPermission.filter({ user_email: currentUser.email }),
      enabled: !!currentUser && currentUser.role !== 'admin',
  });

  const permittedBuildingStats = useMemo(() => {
      if (isLoadingStats || (currentUser && currentUser.role !== 'admin' && isLoadingPermissions)) {
        return [];
      }
      if (!currentUser || !buildingStats) return [];

      if (currentUser.role === 'admin') {
          return buildingStats;
      }

      if (!permissions) {
          return [];
      }
      
      const permittedBuildingIds = new Set(permissions.map(p => p.building_id));
      return buildingStats.filter(stat => permittedBuildingIds.has(stat.building.id));
  }, [buildingStats, currentUser, permissions, isLoadingStats, isLoadingPermissions]);

  const { totalBuildings, totalUnitsCount, totalRentedUnits, totalRevenue } = useMemo(() => {
      const stats = permittedBuildingStats || [];
      return {
          totalBuildings: stats.length,
          totalUnitsCount: stats.reduce((sum, s) => sum + s.totalUnits, 0),
          totalRentedUnits: stats.reduce((sum, s) => sum + s.rentedUnits, 0),
          totalRevenue: stats.reduce((sum, s) => sum + s.totalRent, 0),
      }
  }, [permittedBuildingStats]);

  // Filter-Logik
  const filteredStats = useMemo(() => {
    return permittedBuildingStats.filter(stat => {
      // Status-Filter
      if (filters.status !== 'all') {
        const occupancy = stat.occupancy;
        if (filters.status === 'full' && occupancy !== 100) return false;
        if (filters.status === 'partial' && (occupancy === 100 || occupancy <= 50)) return false;
        if (filters.status === 'empty' && occupancy > 0) return false;
      }

      // City-Filter
      if (filters.city !== 'all' && stat.building.city !== filters.city) return false;

      // Search-Filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          stat.building.name.toLowerCase().includes(searchLower) ||
          (stat.building.address && stat.building.address.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [buildingStats, filters]);

  const deleteMutation = useMutation({
    mutationFn: async (buildingId) => {
      await base44.entities.Building.delete(buildingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Gebäude gelöscht');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Fehler beim Löschen')
  });

  const handleDelete = (building) => {
    setDeleteConfirm(building);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const handleNewBuilding = async () => {
    const newBuilding = await base44.entities.Building.create({
      name: 'Neues Gebäude',
      city: '',
      address: ''
    });
    setEditingBuilding(newBuilding);
  };

  const handleQuickAction = (building) => {
    toast.info('⚡ Quick-Status wird noch implementiert');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Gebäude</h1>
        <p className="text-sm font-extralight text-slate-400 mt-1">{filteredStats.length} von {totalBuildings} Gebäuden</p>
      </div>

      {/* Filter-Bar */}
      <BuildingFilterBar
        buildings={permittedBuildingStats.map(s => s.building)}
        filters={filters}
        onStatusChange={(status) => setFilters({ ...filters, status })}
        onCityChange={(city) => setFilters({ ...filters, city })}
        onSearchChange={(search) => setFilters({ ...filters, search })}
        onNewBuilding={handleNewBuilding}
        renderNewButton={() => (
          <LimitGuard limitType="buildings" currentCount={totalBuildings}>
            <Button
              onClick={handleNewBuilding}
              size="sm"
              className="bg-slate-700 hover:bg-slate-800 font-extralight h-9 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              Neu
            </Button>
          </LimitGuard>
        )}
      />

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-none">
        {filteredStats.length > 0 ? (
          <>
            <BuildingTable
              stats={filteredStats}
              onEdit={setEditingBuilding}
              onDelete={handleDelete}
              onQuickAction={handleQuickAction}
            />
            <BuildingSummary
              totalBuildings={filteredStats.length}
              totalUnitsCount={filteredStats.reduce((sum, s) => sum + s.totalUnits, 0)}
              totalRentedUnits={filteredStats.reduce((sum, s) => sum + s.rentedUnits, 0)}
              totalRevenue={filteredStats.reduce((sum, s) => sum + s.totalRent, 0)}
            />
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm font-extralight text-slate-400">Keine Gebäude gefunden</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <BuildingEditDialog
        building={editingBuilding}
        open={!!editingBuilding}
        onOpenChange={(open) => !open && setEditingBuilding(null)}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        building={deleteConfirm}
        open={!!deleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}