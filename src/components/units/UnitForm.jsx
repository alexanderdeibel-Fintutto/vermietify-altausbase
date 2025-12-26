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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function UnitForm({ open, onOpenChange, onSubmit, initialData, buildingId, isLoading }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || { status: 'vacant', has_balcony: false, has_basement: false, has_parking: false }
    });

    const status = watch('status');

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ status: 'vacant', has_balcony: false, has_basement: false, has_parking: false });
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            building_id: buildingId,
            floor: data.floor ? parseInt(data.floor) : null,
            rooms: data.rooms ? parseFloat(data.rooms) : null,
            sqm: data.sqm ? parseFloat(data.sqm) : null,
            base_rent: data.base_rent ? parseFloat(data.base_rent) : null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Wohnung bearbeiten' : 'Neue Wohnung anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="unit_number">Wohnungsnummer *</Label>
                            <Input 
                                id="unit_number"
                                {...register('unit_number', { required: true })}
                                placeholder="z.B. 1.OG links"
                            />
                        </div>
                        <div>
                            <Label htmlFor="floor">Etage</Label>
                            <Input 
                                id="floor"
                                type="number"
                                {...register('floor')}
                                placeholder="1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="rooms">Zimmer</Label>
                            <Input 
                                id="rooms"
                                type="number"
                                step="0.5"
                                {...register('rooms')}
                                placeholder="3"
                            />
                        </div>
                        <div>
                            <Label htmlFor="sqm">Wohnfläche (m²) *</Label>
                            <Input 
                                id="sqm"
                                type="number"
                                step="0.01"
                                {...register('sqm', { required: true })}
                                placeholder="75"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="base_rent">Kaltmiete (€)</Label>
                            <Input 
                                id="base_rent"
                                type="number"
                                step="0.01"
                                {...register('base_rent')}
                                placeholder="650"
                            />
                        </div>
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select 
                                value={status} 
                                onValueChange={(value) => setValue('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vacant">Leer</SelectItem>
                                    <SelectItem value="occupied">Vermietet</SelectItem>
                                    <SelectItem value="renovation">Renovierung</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="has_balcony">Balkon</Label>
                            <Switch 
                                id="has_balcony"
                                checked={watch('has_balcony')}
                                onCheckedChange={(checked) => setValue('has_balcony', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="has_basement">Keller</Label>
                            <Switch 
                                id="has_basement"
                                checked={watch('has_basement')}
                                onCheckedChange={(checked) => setValue('has_basement', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="has_parking">Stellplatz</Label>
                            <Switch 
                                id="has_parking"
                                checked={watch('has_parking')}
                                onCheckedChange={(checked) => setValue('has_parking', checked)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Notizen</Label>
                        <Textarea 
                            id="notes"
                            {...register('notes')}
                            placeholder="Zusätzliche Informationen..."
                            rows={2}
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