import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Users, FileText } from 'lucide-react';

export default function PurchaseContractForm({ open, onOpenChange, onSubmit, initialData, isLoading, buildingId }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
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
            kaufpreis: data.kaufpreis ? parseFloat(data.kaufpreis) : null,
            kaufpreis_grundstueck: data.kaufpreis_grundstueck ? parseFloat(data.kaufpreis_grundstueck) : null,
            kaufpreis_gebaeude: data.kaufpreis_gebaeude ? parseFloat(data.kaufpreis_gebaeude) : null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Kaufvertrag bearbeiten' : 'Kaufvertrag anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <Accordion type="multiple" className="space-y-2">
                        {/* Vertragspartner */}
                        <AccordionItem value="vertragspartner" className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-600" />
                                    <span className="font-medium">Vertragspartner</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-3">
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-3">Verkäufer</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="verkaeufer_vorname">Vorname</Label>
                                            <Input 
                                                id="verkaeufer_vorname"
                                                {...register('verkaeufer_vorname')}
                                                placeholder="Max"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="verkaeufer_name">Name</Label>
                                            <Input 
                                                id="verkaeufer_name"
                                                {...register('verkaeufer_name')}
                                                placeholder="Mustermann"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="verkaeufer_geburtsdatum">Geburtsdatum</Label>
                                            <Input 
                                                id="verkaeufer_geburtsdatum"
                                                type="date"
                                                {...register('verkaeufer_geburtsdatum')}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="verkaeufer_personalausweis">Personalausweis</Label>
                                            <Input 
                                                id="verkaeufer_personalausweis"
                                                {...register('verkaeufer_personalausweis')}
                                                placeholder="L01X00T47"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="verkaeufer_steuer_id">Steuer-ID</Label>
                                            <Input 
                                                id="verkaeufer_steuer_id"
                                                {...register('verkaeufer_steuer_id')}
                                                placeholder="12 345 678 901"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label htmlFor="verkaeufer_adresse">Adresse</Label>
                                            <Textarea 
                                                id="verkaeufer_adresse"
                                                {...register('verkaeufer_adresse')}
                                                placeholder="Straße, PLZ, Ort"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <h4 className="font-semibold text-slate-800 mb-3">Käufer</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="kaeufer_vorname">Vorname</Label>
                                            <Input 
                                                id="kaeufer_vorname"
                                                {...register('kaeufer_vorname')}
                                                placeholder="Maria"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="kaeufer_name">Name</Label>
                                            <Input 
                                                id="kaeufer_name"
                                                {...register('kaeufer_name')}
                                                placeholder="Musterfrau"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="kaeufer_geburtsdatum">Geburtsdatum</Label>
                                            <Input 
                                                id="kaeufer_geburtsdatum"
                                                type="date"
                                                {...register('kaeufer_geburtsdatum')}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="kaeufer_personalausweis">Personalausweis</Label>
                                            <Input 
                                                id="kaeufer_personalausweis"
                                                {...register('kaeufer_personalausweis')}
                                                placeholder="L01X00T48"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="kaeufer_steuer_id">Steuer-ID</Label>
                                            <Input 
                                                id="kaeufer_steuer_id"
                                                {...register('kaeufer_steuer_id')}
                                                placeholder="12 345 678 902"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label htmlFor="kaeufer_adresse">Adresse</Label>
                                            <Textarea 
                                                id="kaeufer_adresse"
                                                {...register('kaeufer_adresse')}
                                                placeholder="Straße, PLZ, Ort"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Details */}
                        <AccordionItem value="details" className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-600" />
                                    <span className="font-medium">Details</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="kaufvertrag_datum">Kaufvertrag Datum</Label>
                                        <Input 
                                            id="kaufvertrag_datum"
                                            type="date"
                                            {...register('kaufvertrag_datum')}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="uebergabe_datum">Übergabe Datum</Label>
                                        <Input 
                                            id="uebergabe_datum"
                                            type="date"
                                            {...register('uebergabe_datum')}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="notar_name">Notar Name</Label>
                                        <Input 
                                            id="notar_name"
                                            {...register('notar_name')}
                                            placeholder="Dr. Schmidt"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="notar_ort">Notar Ort</Label>
                                        <Input 
                                            id="notar_ort"
                                            {...register('notar_ort')}
                                            placeholder="Berlin"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="kaufpreis">Kaufpreis (€)</Label>
                                        <Input 
                                            id="kaufpreis"
                                            type="number"
                                            step="0.01"
                                            {...register('kaufpreis')}
                                            placeholder="500000.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="kaufpreis_grundstueck">Kaufpreis Grundstück (€)</Label>
                                        <Input 
                                            id="kaufpreis_grundstueck"
                                            type="number"
                                            step="0.01"
                                            {...register('kaufpreis_grundstueck')}
                                            placeholder="200000.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="kaufpreis_gebaeude">Kaufpreis Gebäude (€)</Label>
                                        <Input 
                                            id="kaufpreis_gebaeude"
                                            type="number"
                                            step="0.01"
                                            {...register('kaufpreis_gebaeude')}
                                            placeholder="300000.00"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="inventar_mitverkauft">Inventar mitverkauft</Label>
                                        <Textarea 
                                            id="inventar_mitverkauft"
                                            {...register('inventar_mitverkauft')}
                                            placeholder="z.B. Küche, Einbauschränke, Waschmaschine"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

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