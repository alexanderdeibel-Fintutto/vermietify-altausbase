import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

export default function PropertyTaxForm({ open, onOpenChange, onSubmit, initialData, isLoading, buildingId }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || { building_id: buildingId }
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ building_id: buildingId });
        }
    }, [initialData, reset, buildingId, open]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            grundsteuerbescheid_jahr: data.grundsteuerbescheid_jahr ? parseInt(data.grundsteuerbescheid_jahr) : null,
            grundsteuermessbetrag: data.grundsteuermessbetrag ? parseFloat(data.grundsteuermessbetrag) : null,
            hebesatz_grundsteuer_a: data.hebesatz_grundsteuer_a ? parseFloat(data.hebesatz_grundsteuer_a) : null,
            hebesatz_grundsteuer_b: data.hebesatz_grundsteuer_b ? parseFloat(data.hebesatz_grundsteuer_b) : null,
            hebesatz_grundsteuer_c: data.hebesatz_grundsteuer_c ? parseFloat(data.hebesatz_grundsteuer_c) : null,
            grundsteuer_jahresbetrag: data.grundsteuer_jahresbetrag ? parseFloat(data.grundsteuer_jahresbetrag) : null,
            grundsteuer_quartalsrate: data.grundsteuer_quartalsrate ? parseFloat(data.grundsteuer_quartalsrate) : null,
            grundsteuer_vorjahr_betrag: data.grundsteuer_vorjahr_betrag ? parseFloat(data.grundsteuer_vorjahr_betrag) : null,
        });
    };

    const sepaMandat = watch('sepa_mandat_vorhanden');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Grundsteuerbescheid bearbeiten' : 'Grundsteuerbescheid anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800">Bescheiddaten</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="grundsteuerbescheid_jahr">Jahr *</Label>
                                <Input 
                                    id="grundsteuerbescheid_jahr"
                                    type="number"
                                    {...register('grundsteuerbescheid_jahr', { required: true })}
                                    placeholder="2024"
                                    className={errors.grundsteuerbescheid_jahr ? 'border-red-500' : ''}
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuerbescheid_datum">Bescheiddatum</Label>
                                <Input 
                                    id="grundsteuerbescheid_datum"
                                    type="date"
                                    {...register('grundsteuerbescheid_datum')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuerbescheid_nummer">Bescheid-Nummer</Label>
                                <Input 
                                    id="grundsteuerbescheid_nummer"
                                    {...register('grundsteuerbescheid_nummer')}
                                    placeholder="GB-2024-12345"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuer_typ">Grundsteuer-Typ</Label>
                                <Select 
                                    value={watch('grundsteuer_typ')} 
                                    onValueChange={(value) => setValue('grundsteuer_typ', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Typ wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">A - Land- und Forstwirtschaft</SelectItem>
                                        <SelectItem value="B">B - Grundvermögen</SelectItem>
                                        <SelectItem value="C">C - Betriebsgrundstücke</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Gemeinde</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label htmlFor="gemeinde_name">Gemeinde</Label>
                                <Input 
                                    id="gemeinde_name"
                                    {...register('gemeinde_name')}
                                    placeholder="Stadt Berlin"
                                />
                            </div>
                            <div>
                                <Label htmlFor="gemeinde_finanzamt">Finanzamt</Label>
                                <Input 
                                    id="gemeinde_finanzamt"
                                    {...register('gemeinde_finanzamt')}
                                    placeholder="Finanzamt Berlin-Mitte"
                                />
                            </div>
                            <div>
                                <Label htmlFor="gemeinde_anschrift">Anschrift</Label>
                                <Textarea 
                                    id="gemeinde_anschrift"
                                    {...register('gemeinde_anschrift')}
                                    placeholder="Straße, PLZ, Ort"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Beträge</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="grundsteuermessbetrag">Grundsteuermessbetrag (€)</Label>
                                <Input 
                                    id="grundsteuermessbetrag"
                                    type="number"
                                    step="0.0001"
                                    {...register('grundsteuermessbetrag')}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuermessbetrag_aktenzeichen">Messbetrag Aktenzeichen</Label>
                                <Input 
                                    id="grundsteuermessbetrag_aktenzeichen"
                                    {...register('grundsteuermessbetrag_aktenzeichen')}
                                    placeholder="MB-12345"
                                />
                            </div>
                            <div>
                                <Label htmlFor="hebesatz_grundsteuer_a">Hebesatz A (%)</Label>
                                <Input 
                                    id="hebesatz_grundsteuer_a"
                                    type="number"
                                    step="0.001"
                                    {...register('hebesatz_grundsteuer_a')}
                                    placeholder="0.000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="hebesatz_grundsteuer_b">Hebesatz B (%)</Label>
                                <Input 
                                    id="hebesatz_grundsteuer_b"
                                    type="number"
                                    step="0.001"
                                    {...register('hebesatz_grundsteuer_b')}
                                    placeholder="0.000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="hebesatz_grundsteuer_c">Hebesatz C (%)</Label>
                                <Input 
                                    id="hebesatz_grundsteuer_c"
                                    type="number"
                                    step="0.001"
                                    {...register('hebesatz_grundsteuer_c')}
                                    placeholder="0.000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuer_jahresbetrag">Jahresbetrag (€)</Label>
                                <Input 
                                    id="grundsteuer_jahresbetrag"
                                    type="number"
                                    step="0.01"
                                    {...register('grundsteuer_jahresbetrag')}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuer_quartalsrate">Quartalsrate (€)</Label>
                                <Input 
                                    id="grundsteuer_quartalsrate"
                                    type="number"
                                    step="0.01"
                                    {...register('grundsteuer_quartalsrate')}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuer_vorjahr_betrag">Vorjahr Betrag (€)</Label>
                                <Input 
                                    id="grundsteuer_vorjahr_betrag"
                                    type="number"
                                    step="0.01"
                                    {...register('grundsteuer_vorjahr_betrag')}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Fälligkeiten</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="faelligkeit_q1">Q1 Fälligkeit</Label>
                                <Input 
                                    id="faelligkeit_q1"
                                    type="date"
                                    {...register('faelligkeit_q1')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="faelligkeit_q2">Q2 Fälligkeit</Label>
                                <Input 
                                    id="faelligkeit_q2"
                                    type="date"
                                    {...register('faelligkeit_q2')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="faelligkeit_q3">Q3 Fälligkeit</Label>
                                <Input 
                                    id="faelligkeit_q3"
                                    type="date"
                                    {...register('faelligkeit_q3')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="faelligkeit_q4">Q4 Fälligkeit</Label>
                                <Input 
                                    id="faelligkeit_q4"
                                    type="date"
                                    {...register('faelligkeit_q4')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Zahlung</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="bankverbindung_gemeinde">Bankverbindung Gemeinde</Label>
                                <Textarea 
                                    id="bankverbindung_gemeinde"
                                    {...register('bankverbindung_gemeinde')}
                                    placeholder="IBAN, BIC, Bank"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label htmlFor="verwendungszweck">Verwendungszweck</Label>
                                <Input 
                                    id="verwendungszweck"
                                    {...register('verwendungszweck')}
                                    placeholder="Grundsteuer 2024"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="sepa_mandat_vorhanden"
                                    checked={sepaMandat}
                                    onCheckedChange={(checked) => setValue('sepa_mandat_vorhanden', checked)}
                                />
                                <Label htmlFor="sepa_mandat_vorhanden">SEPA-Mandat vorhanden</Label>
                            </div>
                            {sepaMandat && (
                                <div>
                                    <Label htmlFor="sepa_mandat_referenz">SEPA-Mandatsreferenz</Label>
                                    <Input 
                                        id="sepa_mandat_referenz"
                                        {...register('sepa_mandat_referenz')}
                                        placeholder="SEPA-REF-12345"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Weitere Angaben</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="einheitswert_aktenzeichen">Einheitswert Aktenzeichen</Label>
                                <Input 
                                    id="einheitswert_aktenzeichen"
                                    {...register('einheitswert_aktenzeichen')}
                                    placeholder="EW-12345"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuerwertbescheid_bezug">Grundsteuerwertbescheid Bezug</Label>
                                <Input 
                                    id="grundsteuerwertbescheid_bezug"
                                    {...register('grundsteuerwertbescheid_bezug')}
                                    placeholder="GW-12345"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grundsteuermessbescheid_bezug">Grundsteuermessbescheid Bezug</Label>
                                <Input 
                                    id="grundsteuermessbescheid_bezug"
                                    {...register('grundsteuermessbescheid_bezug')}
                                    placeholder="GM-12345"
                                />
                            </div>
                            <div>
                                <Label htmlFor="bescheid_bestandskraft_datum">Bestandskraft Datum</Label>
                                <Input 
                                    id="bescheid_bestandskraft_datum"
                                    type="date"
                                    {...register('bescheid_bestandskraft_datum')}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="aenderung_seit_vorjahr"
                                    {...register('aenderung_seit_vorjahr')}
                                />
                                <Label htmlFor="aenderung_seit_vorjahr">Änderung seit Vorjahr</Label>
                            </div>
                            <div>
                                <Label htmlFor="aenderung_grund">Änderungsgrund</Label>
                                <Input 
                                    id="aenderung_grund"
                                    {...register('aenderung_grund')}
                                    placeholder="z.B. Neubewertung"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Einspruch</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="einspruch_datum">Einspruch Datum</Label>
                                <Input 
                                    id="einspruch_datum"
                                    type="date"
                                    {...register('einspruch_datum')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="einspruch_aktenzeichen">Einspruch Aktenzeichen</Label>
                                <Input 
                                    id="einspruch_aktenzeichen"
                                    {...register('einspruch_aktenzeichen')}
                                    placeholder="E-12345"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="einspruch_status">Einspruch Status</Label>
                                <Input 
                                    id="einspruch_status"
                                    {...register('einspruch_status')}
                                    placeholder="z.B. eingereicht, abgelehnt, stattgegeben"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="bemerkungen_bescheid">Bemerkungen</Label>
                        <Textarea 
                            id="bemerkungen_bescheid"
                            {...register('bemerkungen_bescheid')}
                            placeholder="Zusätzliche Bemerkungen zum Bescheid"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
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
                </form>
            </DialogContent>
        </Dialog>
    );
}