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
import { Loader2, Sparkles } from 'lucide-react';
import BookingPreviewDialog from '../bookings/BookingPreviewDialog';

export default function FinancingForm({ open, onOpenChange, onSubmit, initialData, isLoading, buildingId }) {
    const [bookingPreviewOpen, setBookingPreviewOpen] = React.useState(false);
    const [savedFinancingId, setSavedFinancingId] = React.useState(null);
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: initialData || { building_id: buildingId }
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ building_id: buildingId });
        }
    }, [initialData, reset, buildingId, open]);

    const handleFormSubmit = async (data) => {
        const result = await onSubmit({
            ...data,
            kreditbetrag: data.kreditbetrag ? parseFloat(data.kreditbetrag) : null,
            zinssatz: data.zinssatz ? parseFloat(data.zinssatz) : null,
            tilgungssatz: data.tilgungssatz ? parseFloat(data.tilgungssatz) : null,
            laufzeit_monate: data.laufzeit_monate ? parseInt(data.laufzeit_monate) : null,
            monatsrate: data.monatsrate ? parseFloat(data.monatsrate) : null,
            restschuld: data.restschuld ? parseFloat(data.restschuld) : null,
            sondertilgung_betrag: data.sondertilgung_betrag ? parseFloat(data.sondertilgung_betrag) : null,
            bereitstellungszins: data.bereitstellungszins ? parseFloat(data.bereitstellungszins) : null,
        });
        
        if (result?.id && !initialData) {
            setSavedFinancingId(result.id);
            setBookingPreviewOpen(true);
        }
    };

    const sondertilgungMoeglich = watch('sondertilgung_moeglich');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Finanzierung bearbeiten' : 'Finanzierung anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800">Kreditgeber</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="kreditgeber">Kreditgeber/Bank *</Label>
                                <Input 
                                    id="kreditgeber"
                                    {...register('kreditgeber', { required: true })}
                                    placeholder="Deutsche Bank"
                                    className={errors.kreditgeber ? 'border-red-500' : ''}
                                />
                            </div>
                            <div>
                                <Label htmlFor="ansprechpartner">Ansprechpartner</Label>
                                <Input 
                                    id="ansprechpartner"
                                    {...register('ansprechpartner')}
                                    placeholder="Max Mustermann"
                                />
                            </div>
                            <div>
                                <Label htmlFor="kontonummer">Konto-/Vertragsnummer</Label>
                                <Input 
                                    id="kontonummer"
                                    {...register('kontonummer')}
                                    placeholder="12345678"
                                />
                            </div>
                            <div>
                                <Label htmlFor="telefon">Telefon</Label>
                                <Input 
                                    id="telefon"
                                    {...register('telefon')}
                                    placeholder="+49 123 456789"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">E-Mail</Label>
                                <Input 
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="kontakt@bank.de"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Kreditkonditionen</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="kreditbetrag">Kreditbetrag (€) *</Label>
                                <Input 
                                    id="kreditbetrag"
                                    type="number"
                                    step="0.01"
                                    {...register('kreditbetrag', { required: true })}
                                    placeholder="500000.00"
                                    className={errors.kreditbetrag ? 'border-red-500' : ''}
                                />
                            </div>
                            <div>
                                <Label htmlFor="restschuld">Restschuld (€)</Label>
                                <Input 
                                    id="restschuld"
                                    type="number"
                                    step="0.01"
                                    {...register('restschuld')}
                                    placeholder="450000.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="zinssatz">Zinssatz (%)</Label>
                                <Input 
                                    id="zinssatz"
                                    type="number"
                                    step="0.01"
                                    {...register('zinssatz')}
                                    placeholder="2.50"
                                />
                            </div>
                            <div>
                                <Label htmlFor="tilgungssatz">Tilgungssatz (%)</Label>
                                <Input 
                                    id="tilgungssatz"
                                    type="number"
                                    step="0.01"
                                    {...register('tilgungssatz')}
                                    placeholder="2.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="zinsbindung_bis">Zinsbindung bis</Label>
                                <Input 
                                    id="zinsbindung_bis"
                                    type="date"
                                    {...register('zinsbindung_bis')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="bereitstellungszins">Bereitstellungszins (%)</Label>
                                <Input 
                                    id="bereitstellungszins"
                                    type="number"
                                    step="0.01"
                                    {...register('bereitstellungszins')}
                                    placeholder="0.25"
                                />
                            </div>
                            <div>
                                <Label htmlFor="monatsrate">Monatsrate (€)</Label>
                                <Input 
                                    id="monatsrate"
                                    type="number"
                                    step="0.01"
                                    {...register('monatsrate')}
                                    placeholder="1875.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="laufzeit_monate">Laufzeit (Monate)</Label>
                                <Input 
                                    id="laufzeit_monate"
                                    type="number"
                                    {...register('laufzeit_monate')}
                                    placeholder="360"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Vertragsdaten</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="vertragsbeginn">Vertragsbeginn</Label>
                                <Input 
                                    id="vertragsbeginn"
                                    type="date"
                                    {...register('vertragsbeginn')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="vertragsende">Vertragsende</Label>
                                <Input 
                                    id="vertragsende"
                                    type="date"
                                    {...register('vertragsende')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Sondertilgung</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="sondertilgung_moeglich"
                                    checked={sondertilgungMoeglich}
                                    onCheckedChange={(checked) => setValue('sondertilgung_moeglich', checked)}
                                />
                                <Label htmlFor="sondertilgung_moeglich">Sondertilgung möglich</Label>
                            </div>
                            {sondertilgungMoeglich && (
                                <div>
                                    <Label htmlFor="sondertilgung_betrag">Max. Sondertilgung pro Jahr (€)</Label>
                                    <Input 
                                        id="sondertilgung_betrag"
                                        type="number"
                                        step="0.01"
                                        {...register('sondertilgung_betrag')}
                                        placeholder="10000.00"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Weitere Angaben</h3>
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="verwendungszweck">Verwendungszweck</Label>
                                <Textarea 
                                    id="verwendungszweck"
                                    {...register('verwendungszweck')}
                                    placeholder="Kauf und Sanierung des Mehrfamilienhauses"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label htmlFor="sicherheiten">Sicherheiten</Label>
                                <Textarea 
                                    id="sicherheiten"
                                    {...register('sicherheiten')}
                                    placeholder="Grundschuld in Höhe von..."
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label htmlFor="notizen">Notizen</Label>
                                <Textarea 
                                    id="notizen"
                                    {...register('notizen')}
                                    placeholder="Zusätzliche Informationen..."
                                    rows={3}
                                />
                            </div>
                        </div>
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

            <BookingPreviewDialog
                open={bookingPreviewOpen}
                onOpenChange={setBookingPreviewOpen}
                sourceType="Kredit"
                sourceId={savedFinancingId}
                onSuccess={() => {
                    setBookingPreviewOpen(false);
                    onOpenChange(false);
                }}
            />
        </Dialog>
    );
}