import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

export default function RecipientForm({ open, onOpenChange, recipient, onSuccess, isLoading }) {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: recipient || {
            name: '',
            type: 'company',
            company_name: '',
            contact_person: '',
            street: '',
            postal_code: '',
            city: '',
            country: 'Deutschland',
            email: '',
            phone: '',
            mobile: '',
            fax: '',
            website: '',
            vat_id: '',
            tax_number: '',
            iban: '',
            bic: '',
            bank_name: '',
            category: '',
            notes: ''
        }
    });

    const selectedType = watch('type');

    useEffect(() => {
        if (recipient) {
            reset(recipient);
        } else {
            reset({
                name: '',
                type: 'company',
                company_name: '',
                contact_person: '',
                street: '',
                postal_code: '',
                city: '',
                country: 'Deutschland',
                email: '',
                phone: '',
                mobile: '',
                fax: '',
                website: '',
                vat_id: '',
                tax_number: '',
                iban: '',
                bic: '',
                bank_name: '',
                category: '',
                notes: ''
            });
        }
    }, [recipient, reset, open]);

    const onSubmit = (data) => {
        onSuccess(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {recipient ? 'Empfänger bearbeiten' : 'Neuer Empfänger'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {/* Grunddaten */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Grunddaten
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Typ *</Label>
                                <Select 
                                    value={watch('type')} 
                                    onValueChange={(value) => setValue('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="company">Firma</SelectItem>
                                        <SelectItem value="person">Privatperson</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input 
                                    id="name"
                                    {...register('name', { required: true })}
                                    placeholder={selectedType === 'company' ? 'Firmenname' : 'Vor- und Nachname'}
                                />
                            </div>

                            {selectedType === 'company' && (
                                <div>
                                    <Label htmlFor="company_name">Zusätzlicher Firmenname</Label>
                                    <Input 
                                        id="company_name"
                                        {...register('company_name')}
                                        placeholder="z.B. GmbH, AG..."
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="contact_person">Ansprechpartner</Label>
                                <Input 
                                    id="contact_person"
                                    {...register('contact_person')}
                                    placeholder="Name des Ansprechpartners"
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">Kategorie</Label>
                                <Input 
                                    id="category"
                                    {...register('category')}
                                    placeholder="z.B. Handwerker, Versorgung, Versicherung"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Adresse
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="street">Straße und Hausnummer</Label>
                                <Input 
                                    id="street"
                                    {...register('street')}
                                    placeholder="Musterstraße 123"
                                />
                            </div>

                            <div>
                                <Label htmlFor="postal_code">PLZ</Label>
                                <Input 
                                    id="postal_code"
                                    {...register('postal_code')}
                                    placeholder="12345"
                                />
                            </div>

                            <div>
                                <Label htmlFor="city">Ort</Label>
                                <Input 
                                    id="city"
                                    {...register('city')}
                                    placeholder="Musterstadt"
                                />
                            </div>

                            <div>
                                <Label htmlFor="country">Land</Label>
                                <Input 
                                    id="country"
                                    {...register('country')}
                                    placeholder="Deutschland"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kontaktdaten */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Kontaktdaten
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="email">E-Mail</Label>
                                <Input 
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="info@beispiel.de"
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">Telefon</Label>
                                <Input 
                                    id="phone"
                                    {...register('phone')}
                                    placeholder="+49 123 456789"
                                />
                            </div>

                            <div>
                                <Label htmlFor="mobile">Mobil</Label>
                                <Input 
                                    id="mobile"
                                    {...register('mobile')}
                                    placeholder="+49 151 12345678"
                                />
                            </div>

                            <div>
                                <Label htmlFor="fax">Fax</Label>
                                <Input 
                                    id="fax"
                                    {...register('fax')}
                                    placeholder="+49 123 456780"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="website">Website</Label>
                                <Input 
                                    id="website"
                                    {...register('website')}
                                    placeholder="https://www.beispiel.de"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Steuerdaten */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Steuerdaten
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="vat_id">UST-ID</Label>
                                <Input 
                                    id="vat_id"
                                    {...register('vat_id')}
                                    placeholder="DE123456789"
                                />
                            </div>

                            <div>
                                <Label htmlFor="tax_number">Steuernummer</Label>
                                <Input 
                                    id="tax_number"
                                    {...register('tax_number')}
                                    placeholder="12/345/67890"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bankdaten */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Bankdaten
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="md:col-span-2">
                                <Label htmlFor="bank_name">Bank</Label>
                                <Input 
                                    id="bank_name"
                                    {...register('bank_name')}
                                    placeholder="Sparkasse Musterstadt"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notizen */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Notizen
                        </h3>
                        <div>
                            <Label htmlFor="notes">Allgemeine Notizen</Label>
                            <Textarea 
                                id="notes"
                                {...register('notes')}
                                placeholder="Weitere Informationen..."
                                className="h-24"
                            />
                        </div>
                    </div>

                    {/* Aktionen */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {recipient ? 'Speichern' : 'Hinzufügen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}