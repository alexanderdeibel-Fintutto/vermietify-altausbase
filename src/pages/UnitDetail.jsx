import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Home, ArrowLeft, Building2, MapPin, Pencil, User, Droplet
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnitForm from '@/components/units/UnitForm';
import UnitLeaseHistory from '@/components/units/UnitLeaseHistory';
import UnitAvailabilityCalendar from '@/components/units/UnitAvailabilityCalendar';

export default function UnitDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const unitId = urlParams.get('id');
    const queryClient = useQueryClient();
    
    const [unitFormOpen, setUnitFormOpen] = useState(false);

    const { data: unit, isLoading: loadingUnit } = useQuery({
        queryKey: ['unit', unitId],
        queryFn: async () => {
            const units = await base44.entities.Unit.filter({ id: unitId });
            return units[0];
        },
        enabled: !!unitId
    });

    const { data: building, isLoading: loadingBuilding } = useQuery({
        queryKey: ['building', unit?.building_id],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: unit.building_id });
            return buildings[0];
        },
        enabled: !!unit?.building_id
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['unit-contracts', unitId],
        queryFn: () => base44.entities.LeaseContract.filter({ unit_id: unitId }),
        enabled: !!unitId
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const updateUnitMutation = useMutation({
        mutationFn: (data) => base44.entities.Unit.update(unitId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
            setUnitFormOpen(false);
        }
    });

    const activeContract = contracts.find(c => c.status === 'active');
    const currentTenant = activeContract ? tenants.find(t => t.id === activeContract.tenant_id) : null;

    const statusLabels = {
        occupied: { label: 'Vermietet', color: 'bg-emerald-100 text-emerald-700' },
        vacant: { label: 'Leer', color: 'bg-amber-100 text-amber-700' },
        renovation: { label: 'Renovierung', color: 'bg-purple-100 text-purple-700' }
    };

    const bathroomLabels = {
        shower: 'Dusche',
        bathtub: 'Wanne',
        both: 'Wanne & Dusche'
    };

    if (loadingUnit || loadingBuilding) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48 rounded-2xl" />
            </div>
        );
    }

    if (!unit) {
        return (
            <div className="text-center py-16">
                <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800">Wohnung nicht gefunden</h2>
                <Link to={createPageUrl('Buildings')}>
                    <Button className="mt-4" variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück zur Übersicht
                    </Button>
                </Link>
            </div>
        );
    }

    const status = statusLabels[unit.status] || statusLabels.vacant;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link 
                        to={createPageUrl(`BuildingDetail?id=${building?.id}`)}
                        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Zurück zum Gebäude
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                        Wohnung {unit.unit_number}
                    </h1>
                    {building && (
                        <div className="flex items-center gap-1.5 text-slate-500 mt-2">
                            <Building2 className="w-4 h-4" />
                            {building.name}
                            <MapPin className="w-4 h-4 ml-2" />
                            {building.address}, {building.city}
                        </div>
                    )}
                </div>
                <Button 
                    variant="outline"
                    onClick={() => setUnitFormOpen(true)}
                >
                    <Pencil className="w-4 h-4 mr-2" />
                    Bearbeiten
                </Button>
            </div>

            {/* Unit Info */}
            <Card className="border-slate-200/50">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <Badge className={status.color}>{status.label}</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-slate-500">Etage</p>
                            <p className="text-lg font-semibold text-slate-800">
                                {unit.floor ? `${unit.floor}. OG` : 'EG'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Zimmer</p>
                            <p className="text-lg font-semibold text-slate-800">{unit.rooms || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Wohnfläche</p>
                            <p className="text-lg font-semibold text-slate-800">{unit.sqm} m²</p>
                        </div>
                        {unit.base_rent && (
                            <div>
                                <p className="text-sm text-slate-500">Kaltmiete</p>
                                <p className="text-lg font-semibold text-slate-800">€{unit.base_rent}</p>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-sm font-medium text-slate-600 mb-3">Ausstattung</p>
                        <div className="flex flex-wrap gap-2">
                            {unit.bathroom_type && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Droplet className="w-3 h-3" />
                                    {bathroomLabels[unit.bathroom_type]}
                                </Badge>
                            )}
                            {unit.has_fitted_kitchen && (
                                <Badge variant="outline">Einbauküche</Badge>
                            )}
                            {unit.has_balcony && (
                                <Badge variant="outline">Balkon</Badge>
                            )}
                            {unit.has_basement && (
                                <Badge variant="outline">Keller</Badge>
                            )}
                            {unit.has_parking && (
                                <Badge variant="outline">Stellplatz</Badge>
                            )}
                        </div>
                    </div>

                    {/* Current Tenant */}
                    {currentTenant && activeContract && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-sm font-medium text-slate-600 mb-3">Aktueller Mieter</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">
                                        {currentTenant.first_name} {currentTenant.last_name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        €{activeContract.total_rent}/Monat
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {unit.notes && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-sm font-medium text-slate-600 mb-2">Notizen</p>
                            <p className="text-sm text-slate-700">{unit.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="history" className="space-y-6">
                <TabsList className="bg-white border border-slate-200">
                    <TabsTrigger value="history">Miethistorie</TabsTrigger>
                    <TabsTrigger value="calendar">Verfügbarkeit</TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                    <UnitLeaseHistory unitId={unitId} />
                </TabsContent>

                <TabsContent value="calendar">
                    <UnitAvailabilityCalendar unitId={unitId} />
                </TabsContent>
            </Tabs>

            <UnitForm
                open={unitFormOpen}
                onOpenChange={setUnitFormOpen}
                onSubmit={(data) => updateUnitMutation.mutate(data)}
                initialData={unit}
                buildingId={unit.building_id}
                isLoading={updateUnitMutation.isPending}
            />
        </div>
    );
}