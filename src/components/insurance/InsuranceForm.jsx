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
import { Loader2 } from 'lucide-react';

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
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: initialData || { building_id: buildingId, zahlungsweise: 'jährlich' }
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ building_id: buildingId, zahlungsweise: 'jährlich' });
        }
    }, [initialData, reset, buildingId, open]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            praemie_jaehrlich: data.praemie_jaehrlich ? parseFloat(data.praemie_jaehrlich) : null,
            deckungssumme: data.deckungssumme ? parseFloat(data.deckungssumme) : null,
            selbstbeteiligung: data.selbstbeteiligung ? parseFloat(data.selbstbeteiligung) : null,
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