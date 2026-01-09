import React, { useState, useMemo } from 'react';
import { useBuildingStats } from '@/components/buildings/useBuildingStats';
import BuildingFilterBar from '@/components/buildings/BuildingFilterBar';
import BuildingTable from '@/components/buildings/BuildingTable';
import BuildingSummary from '@/components/buildings/BuildingSummary';
import BuildingEditDialog from '@/components/buildings/BuildingEditDialog';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/components/buildings/DeleteConfirmDialog';
import LimitGuard from '@/components/package/LimitGuard';

export default function BuildingsPage() {
  const [filters, setFilters] = useState({ status: 'all', city: 'all', search: '' });
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { buildingStats, totalBuildings, totalUnitsCount, totalRentedUnits, totalRevenue } =
    useBuildingStats();

  // Filter-Logik
  const filteredStats = useMemo(() => {
    return buildingStats.filter(stat => {
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
    <div className="space-y-0 bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50/30">
        <h1 className="text-lg font-normal text-slate-900">🏢 Gebäude-Übersicht</h1>
        <p className="text-sm text-slate-600 mt-0.5">{filteredStats.length} von {totalBuildings} Gebäuden</p>
      </div>

      {/* Filter-Bar */}
      <BuildingFilterBar
        buildings={buildingStats.map(s => s.building)}
        filters={filters}
        onStatusChange={(status) => setFilters({ ...filters, status })}
        onCityChange={(city) => setFilters({ ...filters, city })}
        onSearchChange={(search) => setFilters({ ...filters, search })}
        onNewBuilding={() => {}}
        renderNewButton={(onClick) => (
          <LimitGuard limitType="buildings" currentCount={totalBuildings}>
            <button onClick={() => { onClick(); handleNewBuilding(); }}>
              Neues Gebäude
            </button>
          </LimitGuard>
        )}
      />

      {/* Tabelle */}
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
        <div className="p-12 text-center text-slate-500">
          <p>Keine Gebäude gefunden</p>
        </div>
      )}

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