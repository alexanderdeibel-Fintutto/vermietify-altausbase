import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Skeleton className="h-72 rounded-2xl" />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <PageHeader 
                    title="Objekte"
                    subtitle={`${buildings.length} Immobilien verwalten`}
                    action={handleAddNew}
                    actionLabel="Objekt hinzufügen"
                />
            </motion.div>

            <AnimatePresence mode="wait">
                {buildings.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <EmptyState
                            icon={Building2}
                            title="Noch keine Objekte"
                            description="Fügen Sie Ihr erstes Mehrfamilienhaus hinzu, um mit der Verwaltung zu beginnen."
                            action={handleAddNew}
                            actionLabel="Erstes Objekt anlegen"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {buildings.map((building, idx) => (
                            <motion.div
                                key={building.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <BuildingCard 
                                    building={building}
                                    units={units}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

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