import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import BuildingCard from '@/components/buildings/BuildingCard';
import BuildingForm from '@/components/buildings/BuildingForm';

export default function Buildings() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState(null);
    const queryClient = useQueryClient();

    const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Building.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            setFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Building.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            setFormOpen(false);
            setEditingBuilding(null);
        }
    });

    const handleSubmit = (data) => {
        if (editingBuilding) {
            updateMutation.mutate({ id: editingBuilding.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleAddNew = () => {
        setEditingBuilding(null);
        setFormOpen(true);
    };

    if (loadingBuildings) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Gebäude"
                subtitle={`${buildings.length} Immobilien verwalten`}
                action={handleAddNew}
                actionLabel="Gebäude hinzufügen"
            />

            {buildings.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="Noch keine Gebäude"
                    description="Fügen Sie Ihr erstes Mehrfamilienhaus hinzu, um mit der Verwaltung zu beginnen."
                    action={handleAddNew}
                    actionLabel="Erstes Gebäude anlegen"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buildings.map((building) => (
                        <BuildingCard 
                            key={building.id} 
                            building={building}
                            units={units}
                        />
                    ))}
                </div>
            )}

            <BuildingForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingBuilding}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}