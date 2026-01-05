import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GebaeudeManager from './GebaeudeManager';
import FlaechenEinheitenManager from './FlaechenEinheitenManager';
import GrundbuchForm from './GrundbuchForm';
import KubaturForm from './KubaturForm';

export default function BuildingForm({ open, onOpenChange, onSubmit, initialData, isLoading, section, editingUnitIndex }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: initialData || {}
    });
    
    const [gebaeude, setGebaeude] = React.useState([]);
    const [flaechenEinheiten, setFlaechenEinheiten] = React.useState([]);
    const [grundbuch, setGrundbuch] = React.useState({});
    const [kubatur, setKubatur] = React.useState({});
    const [gebaeudeTyp, setGebaeudeTyp] = React.useState('gebaeude');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [checkingDependencies, setCheckingDependencies] = React.useState(false);
    const [dependencies, setDependencies] = React.useState(null);
    const [deleting, setDeleting] = React.useState(false);

    const getDialogTitle = () => {
        if (!initialData) return 'Neues Objekt anlegen';
        if (!section) return 'Objekt bearbeiten';
        if (section === 'flaechen' && editingUnitIndex !== null) {
            return 'Fläche/Einheit bearbeiten';
        }
        const sectionTitles = {
            name: 'Objekt umbenennen',
            lage: 'Lage bearbeiten',
            gebaeude: 'Gebäude bearbeiten',
            flaechen: 'Flächen/Einheiten bearbeiten',
            kubatur: 'Kubatur bearbeiten',
            grundbuch: 'Grundbuch bearbeiten',
            baudaten: 'Baudaten bearbeiten',
            ausstattung: 'Ausstattung bearbeiten',
            energieausweis: 'Energieausweis-Daten bearbeiten'
        };
        return sectionTitles[section] || 'Objekt bearbeiten';
    };

    const shouldShowSection = (sectionName) => {
        if (!section) return true; // Show all if no specific section
        if (section === 'name') return sectionName === 'name'; // Only show name field
        return section === sectionName;
    };

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
            setGebaeude(initialData.gebaeude_data || [{ bezeichnung: 'Gebäude 1', lage_auf_grundstueck: '', eigene_hausnummer: '', gebaeude_standard: 'mittel' }]);
            setGebaeudeTyp(initialData.gebaeude_typ || 'gebaeude');
            if (editingUnitIndex !== null && initialData.flaechen_einheiten) {
                setFlaechenEinheiten([initialData.flaechen_einheiten[editingUnitIndex]]);
            } else if (section === 'flaechen' && editingUnitIndex === null) {
                setFlaechenEinheiten([]);
            } else {
                setFlaechenEinheiten(initialData.flaechen_einheiten || []);
            }
            setGrundbuch(initialData.grundbuch || {});
            setKubatur(initialData.kubatur || {});
        } else {
            reset({});
            setGebaeude([{ bezeichnung: 'Gebäude 1', lage_auf_grundstueck: '', eigene_hausnummer: '', gebaeude_standard: 'mittel' }]);
            setFlaechenEinheiten([]);
            setGrundbuch({});
            setKubatur({});
        }
    }, [initialData, reset, open, editingUnitIndex]);

    const handleFormSubmit = (data) => {
        let finalFlaechenEinheiten = flaechenEinheiten;
        if (editingUnitIndex !== null && initialData?.flaechen_einheiten) {
            // Editing an existing unit
            finalFlaechenEinheiten = [...initialData.flaechen_einheiten];
            finalFlaechenEinheiten[editingUnitIndex] = flaechenEinheiten[0];
        } else if (section === 'flaechen' && initialData?.flaechen_einheiten) {
            // Adding new units to existing building
            finalFlaechenEinheiten = [...initialData.flaechen_einheiten, ...flaechenEinheiten];
        }
        onSubmit({
            ...data,
            gebaeude_typ: gebaeudeTyp,
            gebaeude_data: gebaeude,
            flaechen_einheiten: finalFlaechenEinheiten,
            kubatur: kubatur,
            grundbuch: grundbuch,
            purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
            year_built: data.year_built ? parseInt(data.year_built) : null,
            total_units: data.total_units ? parseInt(data.total_units) : null,
            total_sqm: data.total_sqm ? parseFloat(data.total_sqm) : null,
            garages_parking_spaces: data.garages_parking_spaces ? parseInt(data.garages_parking_spaces) : null,
            heating_year_built: data.heating_year_built ? parseInt(data.heating_year_built) : null,
            window_year_built: data.window_year_built ? parseInt(data.window_year_built) : null,
            energy_demand_kwh_jahr: data.energy_demand_kwh_jahr ? parseFloat(data.energy_demand_kwh_jahr) : null,
            co2_emissions: data.co2_emissions ? parseFloat(data.co2_emissions) : null,
            primary_energy_demand: data.primary_energy_demand ? parseFloat(data.primary_energy_demand) : null,
            final_energy_demand: data.final_energy_demand ? parseFloat(data.final_energy_demand) : null,
        });
    };

    const handleDeleteClick = async () => {
        if (!initialData || editingUnitIndex === null) return;
        
        setCheckingDependencies(true);
        try {
            const response = await base44.functions.invoke('checkFlaechenEinheitDependencies', {
                buildingId: initialData.id,
                unitIndex: editingUnitIndex
            });
            
            setDependencies(response.data.dependencies);
            setDeleteDialogOpen(true);
        } catch (error) {
            alert('Fehler beim Überprüfen der Verknüpfungen: ' + error.message);
        } finally {
            setCheckingDependencies(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!initialData || editingUnitIndex === null) return;
        
        setDeleting(true);
        try {
            await base44.functions.invoke('deleteFlaechenEinheit', {
                buildingId: initialData.id,
                unitIndex: editingUnitIndex
            });
            
            setDeleteDialogOpen(false);
            onOpenChange(false);
            window.location.reload();
        } catch (error) {
            alert('Fehler beim Löschen: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getDialogTitle()}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                        {(!section || section === 'name') && (
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input 
                                    id="name"
                                    {...register('name', { required: true })}
                                    placeholder="z.B. Mein Wohnhaus"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                            </div>
                        )}

                       {shouldShowSection('lage') && (
                       <>
                       <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                           {!section && <h3 className="font-semibold text-slate-800 mb-3">Lage</h3>}
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="address">Straße *</Label>
                                    <Input 
                                        id="address"
                                        {...register('address', { required: true })}
                                        placeholder="Musterstraße"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="house_number">Hausnummer</Label>
                                    <Input 
                                        id="house_number"
                                        {...register('house_number')}
                                        placeholder="10"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="postal_code">PLZ *</Label>
                                        <Input 
                                            id="postal_code"
                                            {...register('postal_code', { required: true })}
                                            placeholder="12345"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="city">Ort *</Label>
                                        <Input 
                                            id="city"
                                            {...register('city', { required: true })}
                                            placeholder="Berlin"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="gps_coordinates">GPS-Koordinaten</Label>
                                    <Input 
                                        id="gps_coordinates"
                                        {...register('gps_coordinates')}
                                        placeholder="52.5200, 13.4050"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="garages_parking_spaces">Anzahl Garagen/Stellplätze</Label>
                                    <Input 
                                        id="garages_parking_spaces"
                                        type="number"
                                        {...register('garages_parking_spaces')}
                                        placeholder="5"
                                    />
                                </div>
                            </div>
                        </div>
                        </>
                        )}

                        {shouldShowSection('gebaeude') && (
                        <>
                        <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                            {!section && <h3 className="font-semibold text-slate-800 mb-3">Gebäude</h3>}
                            <GebaeudeManager 
                                gebaeude={gebaeude} 
                                onChange={setGebaeude}
                                initialGebaeudeTyp={gebaeudeTyp}
                                onGebaeudeTypChange={setGebaeudeTyp}
                            />
                        </div>
                        </>
                        )}

                        {shouldShowSection('flaechen') && (
                        <>
                        <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                            {!section && <h3 className="font-semibold text-slate-800 mb-3">Flächen/Einheiten</h3>}
                            <FlaechenEinheitenManager 
                                einheiten={flaechenEinheiten} 
                                onChange={setFlaechenEinheiten}
                                gebaeude={gebaeude}
                                editingUnitIndex={editingUnitIndex}
                            />
                        </div>
                        </>
                        )}

                        {shouldShowSection('kubatur') && (
                        <>
                        <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                            {!section && <h3 className="font-semibold text-slate-800 mb-3">Kubatur</h3>}
                            <KubaturForm kubatur={kubatur} onChange={setKubatur} register={register} />
                        </div>
                        </>
                        )}

                        {!section && (
                        <>
                        <div className="pt-4 border-t border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-3">Allgemeine Angaben</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="year_built">Baujahr</Label>
                                        <Input 
                                            id="year_built"
                                            type="number"
                                            {...register('year_built')}
                                            placeholder="1990"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="total_units">Anzahl Wohneinheiten</Label>
                                        <Input 
                                            id="total_units"
                                            type="number"
                                            {...register('total_units')}
                                            placeholder="10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="total_sqm">Gesamtfläche (m²)</Label>
                                    <Input 
                                        id="total_sqm"
                                        type="number"
                                        step="0.01"
                                        {...register('total_sqm')}
                                        placeholder="500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="purchase_date">Kaufdatum</Label>
                                        <Input 
                                            id="purchase_date"
                                            type="date"
                                            {...register('purchase_date')}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="purchase_price">Kaufpreis (€)</Label>
                                        <Input 
                                            id="purchase_price"
                                            type="number"
                                            step="0.01"
                                            {...register('purchase_price')}
                                            placeholder="250000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="image_url">Bild-URL</Label>
                                    <Input 
                                        id="image_url"
                                        {...register('image_url')}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                        </>
                        )}

                        {shouldShowSection('baudaten') && (
                        <>
                        <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                            {!section && <h3 className="font-semibold text-slate-800 mb-3">Baudaten</h3>}
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="ready_for_occupancy_date">Bezugsfertig Datum</Label>
                                    <Input 
                                        id="ready_for_occupancy_date"
                                        type="date"
                                        {...register('ready_for_occupancy_date')}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="building_permit_number">Baugenehmigungsnummer</Label>
                                    <Input 
                                        id="building_permit_number"
                                        {...register('building_permit_number')}
                                        placeholder="BG-XXXX-YYYY"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="building_permit_date">Baugenehmigungsdatum</Label>
                                    <Input 
                                        id="building_permit_date"
                                        type="date"
                                        {...register('building_permit_date')}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="building_authority">Zuständiges Bauamt</Label>
                                    <Input 
                                        id="building_authority"
                                        {...register('building_authority')}
                                        placeholder="Bauamt Berlin-Mitte"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="architect_name">Architekt</Label>
                                    <Input 
                                        id="architect_name"
                                        {...register('architect_name')}
                                        placeholder="Architekturbüro Meier"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="construction_company_name">Baufirma</Label>
                                    <Input 
                                        id="construction_company_name"
                                        {...register('construction_company_name')}
                                        placeholder="Bau AG Mustermann"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="construction_method">Bauweise</Label>
                                    <Input 
                                        id="construction_method"
                                        {...register('construction_method')}
                                        placeholder="Massivbauweise"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="roof_shape">Dachform</Label>
                                    <Input 
                                        id="roof_shape"
                                        {...register('roof_shape')}
                                        placeholder="Satteldach"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="roof_covering">Dacheindeckung</Label>
                                    <Input 
                                        id="roof_covering"
                                        {...register('roof_covering')}
                                        placeholder="Ziegel"
                                    />
                                </div>
                            </div>
                        </div>
                        </>
                        )}

                        {shouldShowSection('ausstattung') && (
                        <>
                        <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                            {!section && <h3 className="font-semibold text-slate-800 mb-3">Ausstattung</h3>}
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="heating_type">Heizungsart</Label>
                                    <Input 
                                        id="heating_type"
                                        {...register('heating_type')}
                                        placeholder="Zentralheizung"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="heating_year_built">Heizung Baujahr</Label>
                                    <Input 
                                        id="heating_year_built"
                                        type="number"
                                        {...register('heating_year_built')}
                                        placeholder="2005"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="energy_source">Energieträger</Label>
                                    <Input 
                                        id="energy_source"
                                        {...register('energy_source')}
                                        placeholder="Gas"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="hot_water_production">Warmwassererzeugung</Label>
                                    <Input 
                                        id="hot_water_production"
                                        {...register('hot_water_production')}
                                        placeholder="Durchlauferhitzer"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="insulation_roof"
                                        {...register('insulation_roof')}
                                    />
                                    <label
                                        htmlFor="insulation_roof"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Dachisolierung vorhanden
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="insulation_facade"
                                        {...register('insulation_facade')}
                                    />
                                    <label
                                        htmlFor="insulation_facade"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Fassadenisolierung vorhanden
                                    </label>
                                </div>
                                <div>
                                    <Label htmlFor="window_type">Fensterart</Label>
                                    <Input 
                                        id="window_type"
                                        {...register('window_type')}
                                        placeholder="Doppelverglasung"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="window_year_built">Fenster Baujahr</Label>
                                    <Input 
                                        id="window_year_built"
                                        type="number"
                                        {...register('window_year_built')}
                                        placeholder="2010"
                                    />
                                </div>
                            </div>
                        </div>
                        </>
                        )}

                        {shouldShowSection('grundbuch') && (
                        <>
                        <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                            {!section && <h3 className="font-semibold text-slate-800 mb-3">Grundbuch</h3>}
                            <GrundbuchForm grundbuch={grundbuch} onChange={setGrundbuch} />
                        </div>
                        </>
                        )}

                        {shouldShowSection('energieausweis') && (
                        <>
                        <div className={!section ? "pt-4 border-t border-slate-200" : ""}>
                            {!section && <h3 className="font-semibold text-slate-800 mb-3">Energieausweis-Daten</h3>}
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="energy_certificate_type">Energieausweis Typ</Label>
                                    <Input 
                                        id="energy_certificate_type"
                                        {...register('energy_certificate_type')}
                                        placeholder="Verbrauchsausweis"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="energy_certificate_valid_until">Gültig bis</Label>
                                    <Input 
                                        id="energy_certificate_valid_until"
                                        type="date"
                                        {...register('energy_certificate_valid_until')}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="energy_demand_kwh_jahr">Energiebedarf kWh/Jahr</Label>
                                    <Input 
                                        id="energy_demand_kwh_jahr"
                                        type="number"
                                        step="0.01"
                                        {...register('energy_demand_kwh_jahr')}
                                        placeholder="120.50"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="energy_efficiency_class">Energieeffizienzklasse</Label>
                                    <Input 
                                        id="energy_efficiency_class"
                                        {...register('energy_efficiency_class')}
                                        placeholder="A+"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="co2_emissions">CO2 Emissionen</Label>
                                    <Input 
                                        id="co2_emissions"
                                        type="number"
                                        step="0.01"
                                        {...register('co2_emissions')}
                                        placeholder="25.3"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="primary_energy_demand">Primärenergiebedarf</Label>
                                    <Input 
                                        id="primary_energy_demand"
                                        type="number"
                                        step="0.01"
                                        {...register('primary_energy_demand')}
                                        placeholder="80.00"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="final_energy_demand">Endenergiebedarf</Label>
                                    <Input 
                                        id="final_energy_demand"
                                        type="number"
                                        step="0.01"
                                        {...register('final_energy_demand')}
                                        placeholder="60.00"
                                    />
                                </div>
                            </div>
                        </div>
                        </>
                        )}

                        {!section && (
                        <>
                        <div className="pt-4 border-t border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-3">Eigentümer</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="owner_name">Name</Label>
                                    <Input 
                                        id="owner_name"
                                        {...register('owner_name')}
                                        placeholder="Max Mustermann"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="owner_street">Straße</Label>
                                    <Input 
                                        id="owner_street"
                                        {...register('owner_street')}
                                        placeholder="Musterstraße 1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="owner_postal_code">PLZ</Label>
                                        <Input 
                                            id="owner_postal_code"
                                            {...register('owner_postal_code')}
                                            placeholder="12345"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="owner_city">Ort</Label>
                                        <Input 
                                            id="owner_city"
                                            {...register('owner_city')}
                                            placeholder="Berlin"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-3">Ansprechpartner</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="contact_person">Name</Label>
                                    <Input 
                                        id="contact_person"
                                        {...register('contact_person')}
                                        placeholder="Maria Müller"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contact_phone">Telefonnummer</Label>
                                    <Input 
                                        id="contact_phone"
                                        {...register('contact_phone')}
                                        placeholder="+49 123 456789"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contact_email">E-Mail</Label>
                                    <Input 
                                        id="contact_email"
                                        type="email"
                                        {...register('contact_email')}
                                        placeholder="kontakt@beispiel.de"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-3">Bankverbindung</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="iban">IBAN</Label>
                                    <Input 
                                        id="iban"
                                        {...register('iban')}
                                        placeholder="DE89 3704 0044 0532 0130 00"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="bic">BIC</Label>
                                    <Input 
                                        id="bic"
                                        {...register('bic')}
                                        placeholder="COBADEFFXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="notes">Notizen</Label>
                            <Textarea 
                                id="notes"
                                {...register('notes')}
                                placeholder="Zusätzliche Informationen..."
                                rows={3}
                            />
                        </div>
                        </>
                        )}
                    </div>

                    <div className="flex justify-between items-center gap-3 pt-4">
                        <div>
                            {editingUnitIndex !== null && initialData && (
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={handleDeleteClick}
                                    disabled={checkingDependencies}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                    {checkingDependencies ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 mr-2" />
                                    )}
                                    Fläche löschen
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Abbrechen
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {initialData ? 'Speichern' : 'Anlegen'}
                            </Button>
                        </div>
                    </div>
                </form>
                </DialogContent>

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fläche/Einheit löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dependencies?.canDelete ? (
                                <div className="space-y-2">
                                    <p>Möchten Sie diese Fläche wirklich löschen?</p>
                                    {dependencies.warnings?.length > 0 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                            <p className="text-sm text-yellow-800 font-medium">Warnung:</p>
                                            {dependencies.warnings.map((warning, i) => (
                                                <p key={i} className="text-sm text-yellow-700">{warning}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-red-600 font-medium">Diese Fläche kann nicht gelöscht werden!</p>
                                    <p className="text-sm text-slate-600">Die Fläche ist mit folgenden Daten verknüpft:</p>
                                    <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                        {dependencies?.contracts?.length > 0 && (
                                            <li>{dependencies.contracts.length} Mietvertrag(e)</li>
                                        )}
                                        {dependencies?.payments?.length > 0 && (
                                            <li>{dependencies.payments.length} Zahlung(en)</li>
                                        )}
                                        {dependencies?.financialItems?.length > 0 && (
                                            <li>{dependencies.financialItems.length} Finanzposten</li>
                                        )}
                                        {dependencies?.operatingCostItems?.length > 0 && (
                                            <li>{dependencies.operatingCostItems.length} Betriebskostenposten</li>
                                        )}
                                    </ul>
                                    <p className="text-sm text-slate-600 mt-2">
                                        Bitte entfernen Sie zuerst diese Verknüpfungen, bevor Sie die Fläche löschen.
                                    </p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
                        {dependencies?.canDelete && (
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Löschen
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
                </Dialog>
                );
                }