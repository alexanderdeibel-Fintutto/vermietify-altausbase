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
import { Loader2 } from 'lucide-react';

export default function BuildingForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: initialData || {}
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({});
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
            year_built: data.year_built ? parseInt(data.year_built) : null,
            total_units: data.total_units ? parseInt(data.total_units) : null,
            total_sqm: data.total_sqm ? parseFloat(data.total_sqm) : null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Gebäude bearbeiten' : 'Neues Gebäude anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input 
                                id="name"
                                {...register('name', { required: true })}
                                placeholder="z.B. Hauptstraße 10"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                        </div>

                        <div>
                            <Label htmlFor="address">Adresse *</Label>
                            <Input 
                                id="address"
                                {...register('address', { required: true })}
                                placeholder="Straße und Hausnummer"
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
                                <Label htmlFor="city">Stadt *</Label>
                                <Input 
                                    id="city"
                                    {...register('city', { required: true })}
                                    placeholder="Berlin"
                                />
                            </div>
                        </div>

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
                                <Label htmlFor="total_sqm">Gesamtfläche (m²)</Label>
                                <Input 
                                    id="total_sqm"
                                    type="number"
                                    step="0.01"
                                    {...register('total_sqm')}
                                    placeholder="500"
                                />
                            </div>
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

                        <div>
                            <Label htmlFor="notes">Notizen</Label>
                            <Textarea 
                                id="notes"
                                {...register('notes')}
                                placeholder="Zusätzliche Informationen..."
                                rows={3}
                            />
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
        </Dialog>
    );
}