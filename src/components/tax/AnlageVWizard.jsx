import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import AnlageVValidationResults from './AnlageVValidationResults';

export default function AnlageVWizard({ open, onOpenChange, building, taxYear }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [mappedData, setMappedData] = useState(null);
    const [einnahmen, setEinnahmen] = useState(null);
    const [werbungskosten, setWerbungskosten] = useState(null);
    const [validation, setValidation] = useState(null);
    const [kritischeFehler, setKritischeFehler] = useState([]);
    const [warnungen, setWarnungen] = useState([]);
    const [hinweise, setHinweise] = useState([]);
    const queryClient = useQueryClient();

    const totalSteps = 5;

    useEffect(() => {
        if (open && building) {
            setStep(1);
            loadData();
        }
    }, [open, building]);

    const loadData = async () => {
        if (!building) return;

        setLoading(true);
        try {
            // Schritt 1: Daten mappen
            const mapResponse = await base44.functions.invoke('mapBuildingToAnlageV', {
                building_id: building.id,
                tax_year: taxYear
            });
            setMappedData(mapResponse.data);

            // Schritt 2: Einnahmen berechnen
            const einnahmenResponse = await base44.functions.invoke('calculateAnlageVEinnahmen', {
                building_id: building.id,
                tax_year: taxYear
            });
            setEinnahmen(einnahmenResponse.data.einnahmen);

            // Schritt 3: Werbungskosten berechnen
            const werbungskostenResponse = await base44.functions.invoke('calculateAnlageVWerbungskosten', {
                building_id: building.id,
                tax_year: taxYear
            });
            setWerbungskosten(werbungskostenResponse.data.werbungskosten);

        } catch (error) {
            console.error('Load data error:', error);
            toast.error('Fehler beim Laden der Daten');
        } finally {
            setLoading(false);
        }
    };

    const validateData = async () => {
        setLoading(true);
        try {
            const formData = {
                ...mappedData?.mapped_data,
                ...einnahmen,
                ...werbungskosten
            };

            const response = await base44.functions.invoke('validateAnlageV', {
                form_data: formData,
                building_id: building.id
            });

            setValidation(response.data.validation);
            setKritischeFehler(response.data.kritische_fehler || []);
            setWarnungen(response.data.warnungen || []);
            setHinweise(response.data.hinweise || []);
            return response.data.validation;
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Fehler bei der Validierung');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (step === 4) {
            await validateData();
        }
        setStep(s => Math.min(s + 1, totalSteps));
    };

    const handleBack = () => {
        setStep(s => Math.max(s - 1, 1));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const formData = {
                ...mappedData?.mapped_data,
                ...einnahmen,
                ...werbungskosten
            };

            await base44.entities.AnlageVSubmission.create({
                tax_year: taxYear,
                building_id: building.id,
                form_id: 'anlage_v_2024',
                form_data: formData,
                status: 'validiert',
                validation_result: validation,
                auto_calculated: true,
                last_validated: new Date().toISOString()
            });

            toast.success('Anlage V gespeichert');
            queryClient.invalidateQueries({ queryKey: ['anlageVSubmissions'] });
            onOpenChange(false);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Fehler beim Speichern');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Schritt 1: Grundstücksdaten</h3>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            </div>
                        ) : mappedData ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Adresse</p>
                                    <p className="font-medium">{mappedData.mapped_data.zeile_4}</p>
                                    <p className="font-medium">{mappedData.mapped_data.zeile_5}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Wohnfläche</p>
                                    <p className="font-medium">{mappedData.mapped_data.zeile_10} m²</p>
                                </div>
                                {mappedData.missing_fields.length > 0 && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex gap-2">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                            <div>
                                                <p className="font-medium text-yellow-900">Fehlende Daten</p>
                                                <ul className="text-sm text-yellow-800 mt-1">
                                                    {mappedData.missing_fields.map(field => (
                                                        <li key={field}>• {field}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Schritt 2: Einnahmen</h3>
                        {einnahmen ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">Soll-Miete (Zeile 13)</span>
                                        <span className="font-medium">{einnahmen.zeile_13_soll_miete?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">Ist-Miete (Zeile 14)</span>
                                        <span className="font-medium">{einnahmen.zeile_14_ist_miete?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">Vereinnahmt (Zeile 15)</span>
                                        <span className="font-medium">{einnahmen.zeile_15_vereinnahmt?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">Umlagen (Zeile 20)</span>
                                        <span className="font-medium">{einnahmen.zeile_20_umlagen?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="border-t border-slate-300 pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Summe Einnahmen (Zeile 32)</span>
                                            <span className="font-semibold text-emerald-600">
                                                {einnahmen.zeile_32_summe?.toLocaleString('de-DE')} €
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Schritt 3: Werbungskosten</h3>
                        {werbungskosten ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">AfA (Zeile 33)</span>
                                        <span className="font-medium">{werbungskosten.zeile_33_afa?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">Schuldzinsen (Zeile 39)</span>
                                        <span className="font-medium">{werbungskosten.zeile_39_schuldzinsen?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">Grundsteuer (Zeile 51)</span>
                                        <span className="font-medium">{werbungskosten.zeile_51_grundsteuer?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-600">Verwaltung (Zeile 53)</span>
                                        <span className="font-medium">{werbungskosten.zeile_53_verwaltung?.toLocaleString('de-DE')} €</span>
                                    </div>
                                    <div className="border-t border-slate-300 pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Summe Werbungskosten (Zeile 82)</span>
                                            <span className="font-semibold text-red-600">
                                                {werbungskosten.zeile_82_summe?.toLocaleString('de-DE')} €
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            </div>
                        )}
                    </div>
                );

            case 4:
                const einkuenfte = (einnahmen?.zeile_32_summe || 0) - (werbungskosten?.zeile_82_summe || 0);
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Schritt 4: Zusammenfassung</h3>
                        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-slate-200">
                            <div className="space-y-3">
                                <div className="flex justify-between text-lg">
                                    <span className="text-slate-700">Einnahmen</span>
                                    <span className="font-semibold text-emerald-600">
                                        {einnahmen?.zeile_32_summe?.toLocaleString('de-DE')} €
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span className="text-slate-700">Werbungskosten</span>
                                    <span className="font-semibold text-red-600">
                                        {werbungskosten?.zeile_82_summe?.toLocaleString('de-DE')} €
                                    </span>
                                </div>
                                <div className="border-t-2 border-slate-300 pt-3">
                                    <div className="flex justify-between text-xl">
                                        <span className="font-bold text-slate-800">Einkünfte (Zeile 84)</span>
                                        <span className={`font-bold ${einkuenfte >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {einkuenfte.toLocaleString('de-DE')} €
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Schritt 5: Validierung</h3>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            </div>
                        ) : validation ? (
                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-red-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-red-600">{validation.summary.critical_errors}</p>
                                        <p className="text-sm text-red-800">Kritische Fehler</p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-yellow-600">{validation.summary.warnings}</p>
                                        <p className="text-sm text-yellow-800">Warnungen</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-600">{validation.summary.hints}</p>
                                        <p className="text-sm text-blue-800">Hinweise</p>
                                    </div>
                                </div>

                                {/* Detaillierte Ergebnisse */}
                                <AnlageVValidationResults
                                    validation={validation}
                                    kritischeFehler={kritischeFehler}
                                    warnungen={warnungen}
                                    hinweise={hinweise}
                                />
                            </div>
                        ) : (
                            <Button onClick={validateData} className="w-full">
                                Validierung starten
                            </Button>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (!building) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Anlage V {taxYear} - {building.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Schritt {step} von {totalSteps}</span>
                        <span>{Math.round((step / totalSteps) * 100)}%</span>
                    </div>
                    <Progress value={(step / totalSteps) * 100} />
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    {renderStep()}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1 || loading}
                    >
                        Zurück
                    </Button>
                    <div className="flex gap-2">
                        {step < totalSteps ? (
                            <Button
                                onClick={handleNext}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Weiter
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSave}
                                disabled={loading || !validation?.can_submit}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Speichern
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}