import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles } from 'lucide-react';
import BookingPreviewSection from '../bookings/BookingPreviewSection';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const VERSICHERUNGSTYPEN = [
    'Wohngebäudeversicherung',
    'Elementarschadenversicherung',
    'Glasversicherung',
    'Haus- und Grundbesitzerhaftpflicht',
    'Mietausfall-/Mietnomadenversicherung',
    'Sonstige'
];

const ZAHLUNGSWEISEN = ['jährlich', 'halbjährlich', 'vierteljährlich', 'monatlich'];

export default function InsuranceForm({ open, onOpenChange, onSubmit, initialData, isLoading, buildingId }) {
    const [bookingSuggestions, setBookingSuggestions] = React.useState(null);
    const [isGeneratingBookings, setIsGeneratingBookings] = React.useState(false);
    const [savedInsurance, setSavedInsurance] = React.useState(null);
    
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: { 
            building_id: buildingId, 
            zahlungsweise: 'jährlich', 
            versicherungstyp: '' 
        }
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    versicherungstyp: initialData.versicherungstyp || '',
                    zahlungsweise: initialData.zahlungsweise || 'jährlich'
                });
            } else {
                reset({ building_id: buildingId, zahlungsweise: 'jährlich', versicherungstyp: '' });
            }
        }
    }, [initialData, reset, buildingId, open]);

    const generateBookings = async (insurance) => {
        setIsGeneratingBookings(true);
        try {
            const response = await base44.functions.invoke('generateBookingsFromSource', {
                source_type: 'Versicherung',
                source_id: insurance.id
            });
            
            setBookingSuggestions(response.data.booking_suggestions.map(s => ({
                ...s,
                building_id: response.data.building_id
            })));
            setSavedInsurance(insurance);
        } catch (error) {
            toast.error('Fehler beim Generieren der Buchungen');
            console.error(error);
        } finally {
            setIsGeneratingBookings(false);
        }
    };

    const handleFormSubmit = async (data, createBookings = false) => {
        try {
            const result = await onSubmit({
                ...data,
                praemie_jaehrlich: data.praemie_jaehrlich ? parseFloat(data.praemie_jaehrlich) : null,
                deckungssumme: data.deckungssumme ? parseFloat(data.deckungssumme) : null,
                selbstbeteiligung: data.selbstbeteiligung ? parseFloat(data.selbstbeteiligung) : null,
            });
            
            if (result?.id && !initialData) {
                // Neu angelegt - Buchungen generieren
                await generateBookings(result);
            } else if (createBookings && bookingSuggestions) {
                // Buchungen erstellen
                await createBookingsInDatabase();
                toast.success('Versicherung und Buchungen angelegt');
                onOpenChange(false);
            } else {
                toast.success('Versicherung gespeichert');
                if (!createBookings) {
                    onOpenChange(false);
                }
            }
        } catch (error) {
            console.error('Error submitting insurance:', error);
            toast.error('Fehler beim Speichern');
        }
    };

    const createBookingsInDatabase = async () => {
        const user = await base44.auth.me();
        
        const bookingsToCreate = bookingSuggestions.map(suggestion => ({
            building_id: suggestion.building_id,
            unit_id: suggestion.unit_id || undefined,
            source_type: 'Versicherung',
            source_id: savedInsurance.id,
            source_version: 1,
            due_date: suggestion.due_date,
            original_due_date: suggestion.due_date,
            amount: suggestion.amount,
            original_amount: suggestion.amount,
            description: suggestion.description,
            booking_status: 'Geplant',
            paid_amount: 0,
            outstanding_amount: suggestion.amount,
            linked_transaction_ids: [],
            linked_payment_ids: [],
            is_automatically_created: true,
            is_future_booking: false,
            last_updated: new Date().toISOString(),
            changed_by: user?.email || 'System',
            is_cancelled: false
        }));

        await Promise.all(
            bookingsToCreate.map(booking => 
                base44.entities.GeneratedFinancialBooking.create(booking)
            )
        );

        // Markiere Quelle als verarbeitet
        await base44.entities.Insurance.update(savedInsurance.id, {
            bookings_created: true,
            bookings_created_at: new Date().toISOString(),
            number_of_generated_bookings: bookingSuggestions.length
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Versicherung bearbeiten' : 'Versicherung anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800">Versicherungsdaten</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="versicherungstyp">Versicherungstyp *</Label>
                                <Select 
                                    value={watch('versicherungstyp')} 
                                    onValueChange={(value) => setValue('versicherungstyp', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Typ wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VERSICHERUNGSTYPEN.map(typ => (
                                            <SelectItem key={typ} value={typ}>{typ}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="versicherungsgesellschaft">Versicherungsgesellschaft *</Label>
                                <Input 
                                    id="versicherungsgesellschaft"
                                    {...register('versicherungsgesellschaft', { required: true })}
                                    placeholder="Allianz"
                                    className={errors.versicherungsgesellschaft ? 'border-red-500' : ''}
                                />
                            </div>
                            <div>
                                <Label htmlFor="policennummer">Policen-/Versicherungsnummer</Label>
                                <Input 
                                    id="policennummer"
                                    {...register('policennummer')}
                                    placeholder="POL-123456789"
                                />
                            </div>
                            <div>
                                <Label htmlFor="versicherungsnehmer">Versicherungsnehmer</Label>
                                <Input 
                                    id="versicherungsnehmer"
                                    {...register('versicherungsnehmer')}
                                    placeholder="Max Mustermann"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Vertragslaufzeit</h3>
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
                            <div className="col-span-2">
                                <Label htmlFor="kuendigungsfrist">Kündigungsfrist</Label>
                                <Input 
                                    id="kuendigungsfrist"
                                    {...register('kuendigungsfrist')}
                                    placeholder="3 Monate zum Jahresende"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Prämie & Deckung</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="praemie_jaehrlich">Jährliche Prämie (€)</Label>
                                <Input 
                                    id="praemie_jaehrlich"
                                    type="number"
                                    step="0.01"
                                    {...register('praemie_jaehrlich')}
                                    placeholder="1200.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="zahlungsweise">Zahlungsweise</Label>
                                <Select 
                                    value={watch('zahlungsweise')} 
                                    onValueChange={(value) => setValue('zahlungsweise', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Zahlungsweise wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ZAHLUNGSWEISEN.map(weise => (
                                            <SelectItem key={weise} value={weise}>{weise}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="deckungssumme">Deckungssumme (€)</Label>
                                <Input 
                                    id="deckungssumme"
                                    type="number"
                                    step="0.01"
                                    {...register('deckungssumme')}
                                    placeholder="1000000.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="selbstbeteiligung">Selbstbeteiligung (€)</Label>
                                <Input 
                                    id="selbstbeteiligung"
                                    type="number"
                                    step="0.01"
                                    {...register('selbstbeteiligung')}
                                    placeholder="500.00"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="versicherte_gefahren">Versicherte Gefahren/Leistungen</Label>
                                <Textarea 
                                    id="versicherte_gefahren"
                                    {...register('versicherte_gefahren')}
                                    placeholder="Feuer, Sturm, Hagel, Leitungswasser..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-800">Kontakt</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="kontaktperson">Ansprechpartner</Label>
                                <Input 
                                    id="kontaktperson"
                                    {...register('kontaktperson')}
                                    placeholder="Maria Müller"
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
                                    placeholder="kontakt@versicherung.de"
                                />
                            </div>
                            <div>
                                <Label htmlFor="schadensmeldung_kontakt">Kontakt für Schadensmeldung</Label>
                                <Input 
                                    id="schadensmeldung_kontakt"
                                    {...register('schadensmeldung_kontakt')}
                                    placeholder="Schadenhotline: 0800 123456"
                                />
                            </div>
                        </div>
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

                    <BookingPreviewSection bookingSuggestions={bookingSuggestions} />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        {bookingSuggestions ? (
                            <>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        toast.success('Versicherung gespeichert (Buchungen verworfen)');
                                        onOpenChange(false);
                                    }}
                                    disabled={isLoading}
                                >
                                    Nur Versicherung
                                </Button>
                                <Button 
                                    type="button"
                                    onClick={async () => {
                                        await createBookingsInDatabase();
                                        toast.success(`${bookingSuggestions.length} Buchungen angelegt`);
                                        onOpenChange(false);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Versicherung und Buchungen anlegen
                                </Button>
                            </>
                        ) : (
                            <Button 
                                type="submit" 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading || isGeneratingBookings}
                            >
                                {(isLoading || isGeneratingBookings) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {initialData ? 'Speichern' : 'Anlegen'}
                            </Button>
                        )}
                    </div>
                    </form>
                    </DialogContent>
                    </Dialog>
    );
}