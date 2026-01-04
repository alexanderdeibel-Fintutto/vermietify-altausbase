import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Edit, Trash2, MapPin, Wrench, Zap, Building as BuildingIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import BuildingForm from '@/components/buildings/BuildingForm';

const DetailSection = ({ title, icon: Icon, children, onEdit, summary }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const childrenArray = React.Children.toArray(children);
    const hasContent = childrenArray.some(child => 
        child !== null && 
        child !== undefined && 
        !(typeof child === 'string' && child.trim() === '') &&
        child !== false
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-5 h-5 text-slate-500" />
                        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                        {summary && <span className="text-sm text-slate-500 ml-2">{summary}</span>}
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="outline" size="sm" onClick={onEdit}>
                                <Edit className="w-4 h-4 mr-2" /> Bearbeiten
                            </Button>
                        )}
                        {hasContent && (
                            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            {isExpanded && hasContent && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 pt-0">
                    {children}
                </CardContent>
            )}
            {!hasContent && (
                <CardContent className="text-slate-500 italic pt-0">Keine Daten vorhanden</CardContent>
            )}
        </Card>
    );
};

const DetailItem = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') value = value ? 'Ja' : 'Nein';

    return (
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-medium text-slate-800">{value}</p>
        </div>
    );
};

export default function BuildingDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const buildingId = urlParams.get('buildingId');
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: building, isLoading } = useQuery({
        queryKey: ['building', buildingId],
        queryFn: async () => {
            const buildings = await base44.entities.Building.filter({ id: buildingId });
            return buildings[0];
        },
        enabled: !!buildingId
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Building.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['building'] });
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            setFormOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Building.delete(id),
        onSuccess: () => {
            window.location.href = createPageUrl('Buildings');
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    if (!building) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Gebäude nicht gefunden</h2>
                    <Link to={createPageUrl('Buildings')}>
                        <Button>Zurück zu Gebäuden</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleFormSubmit = (data) => {
        updateMutation.mutate({ id: building.id, data });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={createPageUrl('Buildings')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{building.name}</h1>
                        <p className="text-slate-500">
                            {building.address} {building.house_number}, {building.postal_code} {building.city}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setFormOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Gebäude bearbeiten
                    </Button>
                    <Button 
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Löschen
                    </Button>
                </div>
            </div>

            {/* Lage */}
            <DetailSection 
                title="Lage"
                icon={MapPin}
                summary={building.address && building.house_number ? `${building.address} ${building.house_number}, ${building.city}` : ''}
                onEdit={() => setFormOpen(true)}
            >
                <DetailItem label="Straße" value={building.address} />
                <DetailItem label="Hausnummer" value={building.house_number} />
                <DetailItem label="PLZ" value={building.postal_code} />
                <DetailItem label="Ort" value={building.city} />
                <DetailItem label="GPS-Koordinaten" value={building.gps_coordinates} />
                <DetailItem label="Garagen/Stellplätze" value={building.garages_parking_spaces} />
            </DetailSection>

            {/* Baudaten */}
            <DetailSection 
                title="Baudaten"
                icon={BuildingIcon}
                summary={building.year_built ? `Baujahr: ${building.year_built}` : ''}
                onEdit={() => setFormOpen(true)}
            >
                <DetailItem label="Baujahr" value={building.year_built} />
                <DetailItem 
                    label="Bezugsfertig Datum" 
                    value={building.ready_for_occupancy_date ? format(parseISO(building.ready_for_occupancy_date), 'dd.MM.yyyy', { locale: de }) : null} 
                />
                <DetailItem label="Baugenehmigungsnummer" value={building.building_permit_number} />
                <DetailItem 
                    label="Baugenehmigungsdatum" 
                    value={building.building_permit_date ? format(parseISO(building.building_permit_date), 'dd.MM.yyyy', { locale: de }) : null} 
                />
                <DetailItem label="Zuständiges Bauamt" value={building.building_authority} />
                <DetailItem label="Architekt" value={building.architect_name} />
                <DetailItem label="Baufirma" value={building.construction_company_name} />
                <DetailItem label="Bauweise" value={building.construction_method} />
                <DetailItem label="Dachform" value={building.roof_shape} />
                <DetailItem label="Dacheindeckung" value={building.roof_covering} />
            </DetailSection>

            {/* Ausstattung */}
            <DetailSection 
                title="Ausstattung"
                icon={Wrench}
                summary={building.heating_type ? `Heizung: ${building.heating_type}` : ''}
                onEdit={() => setFormOpen(true)}
            >
                <DetailItem label="Heizungsart" value={building.heating_type} />
                <DetailItem label="Heizung Baujahr" value={building.heating_year_built} />
                <DetailItem label="Energieträger" value={building.energy_source} />
                <DetailItem label="Warmwassererzeugung" value={building.hot_water_production} />
                <DetailItem label="Dachisolierung" value={building.insulation_roof} />
                <DetailItem label="Fassadenisolierung" value={building.insulation_facade} />
                <DetailItem label="Fensterart" value={building.window_type} />
                <DetailItem label="Fenster Baujahr" value={building.window_year_built} />
            </DetailSection>

            {/* Energieausweis-Daten */}
            <DetailSection 
                title="Energieausweis-Daten"
                icon={Zap}
                summary={building.energy_efficiency_class ? `Effizienzklasse: ${building.energy_efficiency_class}` : ''}
                onEdit={() => setFormOpen(true)}
            >
                <DetailItem label="Energieausweis Typ" value={building.energy_certificate_type} />
                <DetailItem 
                    label="Gültig bis" 
                    value={building.energy_certificate_valid_until ? format(parseISO(building.energy_certificate_valid_until), 'dd.MM.yyyy', { locale: de }) : null} 
                />
                <DetailItem label="Energiebedarf kWh/Jahr" value={building.energy_demand_kwh_jahr} />
                <DetailItem label="Energieeffizienzklasse" value={building.energy_efficiency_class} />
                <DetailItem label="CO2 Emissionen" value={building.co2_emissions} />
                <DetailItem label="Primärenergiebedarf" value={building.primary_energy_demand} />
                <DetailItem label="Endenergiebedarf" value={building.final_energy_demand} />
            </DetailSection>

            {/* Form & Delete Dialog */}
            <BuildingForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                initialData={building}
                isLoading={updateMutation.isPending}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Gebäude löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie dieses Gebäude wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(building.id)}
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