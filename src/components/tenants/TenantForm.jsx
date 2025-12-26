import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

export default function TenantForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: initialData || { jobcenter: false }
    });

    const jobcenter = watch('jobcenter');

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ jobcenter: false });
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Mieter bearbeiten' : 'Neuen Mieter anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="first_name">Vorname *</Label>
                            <Input 
                                id="first_name"
                                {...register('first_name', { required: true })}
                                placeholder="Max"
                            />
                        </div>
                        <div>
                            <Label htmlFor="last_name">Nachname *</Label>
                            <Input 
                                id="last_name"
                                {...register('last_name', { required: true })}
                                placeholder="Mustermann"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="email">E-Mail</Label>
                            <Input 
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="max@beispiel.de"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Telefonnummer</Label>
                            <Input 
                                id="phone"
                                {...register('phone')}
                                placeholder="0171 1234567"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="date_of_birth">Geburtsdatum</Label>
                        <Input 
                            id="date_of_birth"
                            type="date"
                            {...register('date_of_birth')}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Alte Adresse</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="previous_street">Straße</Label>
                                <Input 
                                    id="previous_street"
                                    {...register('previous_street')}
                                    placeholder="Musterstraße 123"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="previous_postal_code">PLZ</Label>
                                    <Input 
                                        id="previous_postal_code"
                                        {...register('previous_postal_code')}
                                        placeholder="12345"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="previous_city">Ort</Label>
                                    <Input 
                                        id="previous_city"
                                        {...register('previous_city')}
                                        placeholder="Berlin"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Jobcenter</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="jobcenter">Jobcenter</Label>
                                <Switch 
                                    id="jobcenter"
                                    checked={jobcenter}
                                    onCheckedChange={(checked) => setValue('jobcenter', checked)}
                                />
                            </div>
                            {jobcenter && (
                                <div>
                                    <Label htmlFor="jobcenter_customer_number">Kundennummer Jobcenter</Label>
                                    <Input 
                                        id="jobcenter_customer_number"
                                        {...register('jobcenter_customer_number')}
                                        placeholder="123456789"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Berufliche Informationen</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="occupation">Beruf</Label>
                                <Input 
                                    id="occupation"
                                    {...register('occupation')}
                                    placeholder="Ingenieur"
                                />
                            </div>
                            <div>
                                <Label htmlFor="employer">Arbeitgeber</Label>
                                <Input 
                                    id="employer"
                                    {...register('employer')}
                                    placeholder="Firma GmbH"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <Label htmlFor="monthly_income">Monatliches Einkommen (€)</Label>
                            <Input 
                                id="monthly_income"
                                type="number"
                                step="0.01"
                                {...register('monthly_income')}
                                placeholder="2500"
                            />
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
                            {initialData ? 'Speichern' : 'Anlegen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}