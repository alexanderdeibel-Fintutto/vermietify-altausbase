import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Edit, Trash2, MapPin, Wrench, Zap, Building as BuildingIcon, Home, ChevronDown, ChevronUp, Plus } from 'lucide-react';
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

    if (!hasContent) return null;

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                            <Icon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-slate-800 mb-1">{title}</CardTitle>
                            {summary && (
                                <p className="text-slate-600 text-sm leading-relaxed">{summary}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {onEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                                <Edit className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 pt-0 border-t border-slate-100">
                    {children}
                </CardContent>
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
    const [editingSection, setEditingSection] = useState(null);
    const [editingUnitIndex, setEditingUnitIndex] = useState(null);
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

    const handleEditSection = (section) => {
        setEditingSection(section);
        setEditingUnitIndex(null);
        setFormOpen(true);
    };

    const handleEditUnit = (index) => {
        setEditingUnitIndex(index);
        setEditingSection('flaechen');
        setFormOpen(true);
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
                <div className="flex gap-1">
                    <Button 
                        onClick={() => {
                            setEditingSection('name');
                            setFormOpen(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-slate-800"
                    >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Umbenennen
                    </Button>
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Löschen
                    </Button>
                </div>
            </div>

            {/* Lage */}
            <DetailSection 
                title="Lage"
                icon={MapPin}
                summary={building.address && building.city ? `${building.address}${building.house_number ? ' ' + building.house_number : ''}, ${building.postal_code} ${building.city}${building.gps_coordinates ? ' • GPS: ' + building.gps_coordinates : ''}${building.garages_parking_spaces ? ' • ' + building.garages_parking_spaces + ' Stellplätze' : ''}` : null}
                onEdit={() => handleEditSection('lage')}
            >
                <DetailItem label="Straße" value={building.address} />
                <DetailItem label="Hausnummer" value={building.house_number} />
                <DetailItem label="PLZ" value={building.postal_code} />
                <DetailItem label="Ort" value={building.city} />
                <DetailItem label="GPS-Koordinaten" value={building.gps_coordinates} />
                <DetailItem label="Garagen/Stellplätze" value={building.garages_parking_spaces} />
            </DetailSection>

            {/* Gebäude */}
            <DetailSection 
                title="Gebäude"
                icon={BuildingIcon}
                summary={building.gebaeude_data && building.gebaeude_data.length > 0 ? `${building.gebaeude_data.length} Gebäude auf dem Grundstück` : 'Noch keine Gebäude angelegt'}
                onEdit={() => handleEditSection('gebaeude')}
            >
                {building.gebaeude_data && building.gebaeude_data.length > 0 ? (
                    building.gebaeude_data.map((geb, index) => (
                        <div key={index} className="col-span-full">
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <h4 className="font-semibold text-slate-800">{geb.bezeichnung}</h4>
                                {geb.lage_auf_grundstueck && (
                                    <p className="text-sm text-slate-600">Lage: {geb.lage_auf_grundstueck}</p>
                                )}
                                {geb.eigene_hausnummer && (
                                    <p className="text-sm text-slate-600">Hausnummer: {geb.eigene_hausnummer}</p>
                                )}
                                {geb.gebaeude_standard && (
                                    <p className="text-sm text-slate-600">Standard: {geb.gebaeude_standard}</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-4 text-slate-500">
                        Noch keine Gebäude angelegt
                    </div>
                )}
            </DetailSection>

            {/* Flächen/Einheiten */}
            <DetailSection 
                title="Flächen/Einheiten"
                icon={Home}
                summary={(() => {
                    if (!building.flaechen_einheiten || building.flaechen_einheiten.length === 0) {
                        return 'Noch keine Flächen angelegt';
                    }

                    const einheiten = building.flaechen_einheiten;
                    const total = einheiten.length;

                    // Zähle die verschiedenen Arten
                    const artCounts = {};
                    einheiten.forEach(e => {
                        const art = e.art || 'Unbekannt';
                        artCounts[art] = (artCounts[art] || 0) + 1;
                    });

                    // Erstelle die Zusammenfassung der Arten
                    const artSummary = Object.entries(artCounts)
                        .map(([art, count]) => `${count}x ${art}`)
                        .join(', ');

                    // Berechne vermietbare QM (nicht "nicht vermietbar")
                    const vermietbareQm = einheiten
                        .filter(e => e.art !== 'nicht vermietbar')
                        .reduce((sum, e) => sum + (e.qm || 0), 0);

                    return `${total} Flächen (${artSummary}) • ${vermietbareQm.toFixed(2)} qm vermietbar`;
                })()}
                onEdit={() => handleEditSection('flaechen')}
                >
                <div className="col-span-full">
                    {building.flaechen_einheiten && building.flaechen_einheiten.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">Art</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">Bezeichnung</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">Gebäude</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">Etage</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">Lage</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">qm</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">Zimmer</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">Ausstattung</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-slate-600">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {building.flaechen_einheiten.map((einheit, index) => {
                                        const gebaeudeBezeichnung = building.gebaeude_data?.[einheit.gebaeude_index]?.bezeichnung || '-';
                                        const artLabel = einheit.art || 'Unbekannt';
                                        const ausstattung = [
                                            einheit.bad && 'Bad',
                                            einheit.kueche && 'Küche',
                                            einheit.keller && 'Keller',
                                            einheit.sat_tv && 'Sat/TV',
                                            einheit.internet && (einheit.internet === 'wlan' ? 'W-LAN' : einheit.internet === 'glasfaser' ? 'Glasfaser' : 'Tel')
                                        ].filter(Boolean).join(', ') || '-';

                                        return (
                                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-3 px-3 text-sm text-slate-800">{artLabel}</td>
                                                <td className="py-3 px-3 text-sm text-slate-800 font-medium">{einheit.bezeichnung || '-'}</td>
                                                <td className="py-3 px-3 text-sm text-slate-600">{gebaeudeBezeichnung}</td>
                                                <td className="py-3 px-3 text-sm text-slate-600">{einheit.etage}</td>
                                                <td className="py-3 px-3 text-sm text-slate-600">{einheit.lage || '-'}</td>
                                                <td className="py-3 px-3 text-sm text-slate-600">{einheit.qm || '-'}</td>
                                                <td className="py-3 px-3 text-sm text-slate-600">{einheit.anzahl_wohnzimmer || '-'}</td>
                                                <td className="py-3 px-3 text-sm text-slate-600 max-w-[200px] truncate" title={ausstattung}>{ausstattung}</td>
                                                <td className="py-3 px-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditUnit(index)}
                                                        className="h-7 px-2 text-slate-600 hover:text-slate-800"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditSection('flaechen')}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Neue Fläche hinzufügen
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-500 mb-4">Noch keine Flächen/Einheiten angelegt</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSection('flaechen')}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Erste Fläche hinzufügen
                            </Button>
                        </div>
                    )}
                </div>
                </DetailSection>

            {/* Baudaten */}
            <DetailSection 
                title="Baudaten"
                icon={BuildingIcon}
                summary={building.year_built || building.construction_method || building.roof_shape ? `${building.year_built ? 'Baujahr ' + building.year_built : ''}${building.construction_method ? (building.year_built ? ' • ' : '') + building.construction_method : ''}${building.roof_shape ? ' • ' + building.roof_shape : ''}` : null}
                onEdit={() => handleEditSection('baudaten')}
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
                summary={building.heating_type || building.energy_source || building.window_type ? `${building.heating_type ? building.heating_type : ''}${building.energy_source ? (building.heating_type ? ' (' + building.energy_source + ')' : building.energy_source) : ''}${building.window_type ? ' • Fenster: ' + building.window_type : ''}${building.insulation_roof || building.insulation_facade ? ' • Isolierung vorhanden' : ''}` : null}
                onEdit={() => handleEditSection('ausstattung')}
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
                summary={building.energy_efficiency_class || building.energy_demand_kwh_jahr ? `${building.energy_efficiency_class ? 'Klasse ' + building.energy_efficiency_class : ''}${building.energy_demand_kwh_jahr ? (building.energy_efficiency_class ? ' • ' : '') + building.energy_demand_kwh_jahr + ' kWh/Jahr' : ''}${building.energy_certificate_valid_until ? ' • Gültig bis ' + format(parseISO(building.energy_certificate_valid_until), 'MM/yyyy', { locale: de }) : ''}` : null}
                onEdit={() => handleEditSection('energieausweis')}
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
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) {
                        setEditingSection(null);
                        setEditingUnitIndex(null);
                    }
                }}
                onSubmit={handleFormSubmit}
                initialData={building}
                isLoading={updateMutation.isPending}
                section={editingSection}
                editingUnitIndex={editingUnitIndex}
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