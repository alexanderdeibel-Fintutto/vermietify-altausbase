import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Building2, MapPin, Calendar, Euro, ArrowLeft, Plus, 
    Home, MoreVertical, Pencil, Trash2, User
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UnitForm from '@/components/units/UnitForm';
import BuildingForm from '@/components/buildings/BuildingForm';

export default function BuildingDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const buildingId = urlParams.get('id');
    const queryClient = useQueryClient();
    
    const [unitFormOpen, setUnitFormOpen] = useState(false);
    const [buildingFormOpen, setBuildingFormOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [deleteUnit, setDeleteUnit] = useState(null);

    const { data: building, isLoading: loadingBuilding } = useQuery({
        queryKey: ['building', buildingId],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: buildingId });
            return buildings[0];
        },
        enabled: !!buildingId
    });

    const { data: units = [], isLoading: loadingUnits } = useQuery({
        queryKey: ['units', buildingId],
        queryFn: async () => {
            return await base44.entities.Unit.filter({ building_id: buildingId });
        },
        enabled: !!buildingId
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const createUnitMutation = useMutation({
        mutationFn: (data) => base44.entities.Unit.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setUnitFormOpen(false);
        }
    });

    const updateUnitMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Unit.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setUnitFormOpen(false);
            setEditingUnit(null);
        }
    });

    const deleteUnitMutation = useMutation({
        mutationFn: (id) => base44.entities.Unit.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setDeleteUnit(null);
        }
    });

    const updateBuildingMutation = useMutation({
        mutationFn: (data) => base44.entities.Building.update(buildingId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
            setBuildingFormOpen(false);
        }
    });

    const handleUnitSubmit = (data) => {
        if (editingUnit) {
            updateUnitMutation.mutate({ id: editingUnit.id, data });
        } else {
            createUnitMutation.mutate(data);
        }
    };

    const getActiveContract = (unitId) => {
        return contracts.find(c => c.unit_id === unitId && c.status === 'active');
    };

    const getTenant = (tenantId) => {
        return tenants.find(t => t.id === tenantId);
    };

    const statusLabels = {
        occupied: { label: 'Vermietet', color: 'bg-emerald-100 text-emerald-700' },
        vacant: { label: 'Leer', color: 'bg-amber-100 text-amber-700' },
        renovation: { label: 'Renovierung', color: 'bg-purple-100 text-purple-700' }
    };

    if (loadingBuilding || loadingUnits) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!building) {
        return (
            <div className="text-center py-16">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800">Gebäude nicht gefunden</h2>
                <Link to={createPageUrl('Buildings')}>
                    <Button className="mt-4" variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück zur Übersicht
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link 
                        to={createPageUrl('Buildings')}
                        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Zurück
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">{building.name}</h1>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-2">
                        <MapPin className="w-4 h-4" />
                        {building.address}, {building.postal_code} {building.city}
                    </div>
                </div>
                <Button 
                    variant="outline"
                    onClick={() => setBuildingFormOpen(true)}
                >
                    <Pencil className="w-4 h-4 mr-2" />
                    Bearbeiten
                </Button>
            </div>

            {/* Building Info */}
            <Card className="border-slate-200/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {building.year_built && (
                            <div>
                                <p className="text-sm text-slate-500">Baujahr</p>
                                <p className="text-lg font-semibold text-slate-800">{building.year_built}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-slate-500">Wohneinheiten</p>
                            <p className="text-lg font-semibold text-slate-800">{units.length}</p>
                        </div>
                        {building.total_sqm && (
                            <div>
                                <p className="text-sm text-slate-500">Gesamtfläche</p>
                                <p className="text-lg font-semibold text-slate-800">{building.total_sqm} m²</p>
                            </div>
                        )}
                        {building.purchase_price && (
                            <div>
                                <p className="text-sm text-slate-500">Kaufpreis</p>
                                <p className="text-lg font-semibold text-slate-800">
                                    €{building.purchase_price.toLocaleString('de-DE')}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Units */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-800">Wohnungen</h2>
                    <Button 
                        onClick={() => {
                            setEditingUnit(null);
                            setUnitFormOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Wohnung hinzufügen
                    </Button>
                </div>

                {units.length === 0 ? (
                    <Card className="border-slate-200/50">
                        <CardContent className="py-16 text-center">
                            <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Noch keine Wohnungen
                            </h3>
                            <p className="text-slate-500 mb-6">
                                Fügen Sie die erste Wohnung zu diesem Gebäude hinzu.
                            </p>
                            <Button 
                                onClick={() => setUnitFormOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Erste Wohnung anlegen
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {units.map((unit) => {
                            const contract = getActiveContract(unit.id);
                            const tenant = contract ? getTenant(contract.tenant_id) : null;
                            const status = statusLabels[unit.status] || statusLabels.vacant;

                            return (
                                <Card key={unit.id} className="border-slate-200/50 hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">
                                                    {unit.unit_number}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {unit.floor ? `${unit.floor}. OG` : 'EG'} • {unit.rooms || '-'} Zimmer • {unit.sqm} m²
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditingUnit(unit);
                                                        setUnitFormOpen(true);
                                                    }}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Bearbeiten
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => setDeleteUnit(unit)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Löschen
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <Badge className={status.color}>
                                            {status.label}
                                        </Badge>

                                        {tenant && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {tenant.first_name} {tenant.last_name}
                                                        </p>
                                                        {contract && (
                                                            <p className="text-xs text-slate-500">
                                                                €{contract.total_rent}/Monat
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!tenant && unit.base_rent && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-sm text-slate-500">
                                                    Kaltmiete: <span className="font-medium text-slate-700">€{unit.base_rent}</span>
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            {unit.has_balcony && (
                                                <Badge variant="outline" className="text-xs">Balkon</Badge>
                                            )}
                                            {unit.has_basement && (
                                                <Badge variant="outline" className="text-xs">Keller</Badge>
                                            )}
                                            {unit.has_parking && (
                                                <Badge variant="outline" className="text-xs">Stellplatz</Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <UnitForm
                open={unitFormOpen}
                onOpenChange={setUnitFormOpen}
                onSubmit={handleUnitSubmit}
                initialData={editingUnit}
                buildingId={buildingId}
                isLoading={createUnitMutation.isPending || updateUnitMutation.isPending}
            />

            <BuildingForm
                open={buildingFormOpen}
                onOpenChange={setBuildingFormOpen}
                onSubmit={(data) => updateBuildingMutation.mutate(data)}
                initialData={building}
                isLoading={updateBuildingMutation.isPending}
            />

            <AlertDialog open={!!deleteUnit} onOpenChange={() => setDeleteUnit(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Wohnung löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie die Wohnung "{deleteUnit?.unit_number}" wirklich löschen?
                            Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteUnitMutation.mutate(deleteUnit.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}