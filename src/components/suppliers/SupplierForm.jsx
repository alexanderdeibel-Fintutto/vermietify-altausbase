import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles } from 'lucide-react';
import BookingPreviewDialog from '../bookings/BookingPreviewDialog';
import { toast } from 'sonner';

const DEFAULT_SUPPLIER_TYPES = [
    'Wasserversorger',
    'Abwasserentsorgung',
    'Müllentsorgung',
    'Schornsteinfeger',
    'Internet-Provider',
    'Kabel-TV-Anbieter'
];

export default function SupplierForm({ open, onOpenChange, onSubmit, initialData, isLoading, buildingId }) {
    const [bookingPreviewOpen, setBookingPreviewOpen] = React.useState(false);
    const [savedSupplierId, setSavedSupplierId] = React.useState(null);
    
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || { building_id: buildingId }
    });

    const [supplierTypes, setSupplierTypes] = React.useState(DEFAULT_SUPPLIER_TYPES);
    const [showCustomType, setShowCustomType] = React.useState(false);
    const [customTypeName, setCustomTypeName] = React.useState('');

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
            if (!DEFAULT_SUPPLIER_TYPES.includes(initialData.supplier_type)) {
                if (!supplierTypes.includes(initialData.supplier_type)) {
                    setSupplierTypes([...DEFAULT_SUPPLIER_TYPES, initialData.supplier_type]);
                }
            }
        } else {
            reset({ building_id: buildingId });
        }
    }, [initialData, reset, buildingId, open]);

    const handleAddCustomType = () => {
        if (customTypeName.trim() && !supplierTypes.includes(customTypeName.trim())) {
            const newTypes = [...supplierTypes, customTypeName.trim()];
            setSupplierTypes(newTypes);
            setValue('supplier_type', customTypeName.trim());
            setCustomTypeName('');
            setShowCustomType(false);
        }
    };

    const handleFormSubmit = async (data) => {
        const result = await onSubmit(data);
        
        if (result?.id) {
            setSavedSupplierId(result.id);
            toast.success('Versorger gespeichert', {
                action: {
                    label: 'Buchungen generieren',
                    onClick: () => setBookingPreviewOpen(true)
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Versorger bearbeiten' : 'Versorger anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="supplier_type">Art des Versorgers *</Label>
                        {showCustomType ? (
                            <div className="flex gap-2">
                                <Input 
                                    value={customTypeName}
                                    onChange={(e) => setCustomTypeName(e.target.value)}
                                    placeholder="Neue Art eingeben..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomType())}
                                />
                                <Button 
                                    type="button"
                                    onClick={handleAddCustomType}
                                    disabled={!customTypeName.trim()}
                                >
                                    OK
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowCustomType(false);
                                        setCustomTypeName('');
                                    }}
                                >
                                    Abbrechen
                                </Button>
                            </div>
                        ) : (
                            <Select 
                                value={watch('supplier_type')} 
                                onValueChange={(value) => {
                                    if (value === '__custom__') {
                                        setShowCustomType(true);
                                    } else {
                                        setValue('supplier_type', value);
                                    }
                                }}
                            >
                                <SelectTrigger className={errors.supplier_type ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Art wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {supplierTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="__custom__" className="text-emerald-600 font-medium">
                                        + Neue Art hinzufügen
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input 
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Stadtwerke Berlin"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="address">Adresse</Label>
                        <Input 
                            id="address"
                            {...register('address')}
                            placeholder="Straße, PLZ, Ort"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="phone">Telefonnummer</Label>
                            <Input 
                                id="phone"
                                {...register('phone')}
                                placeholder="+49 30 12345678"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">E-Mail</Label>
                            <Input 
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="info@versorger.de"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="customer_number">Kundennummer</Label>
                            <Input 
                                id="customer_number"
                                {...register('customer_number')}
                                placeholder="KD-123456"
                            />
                        </div>
                        <div>
                            <Label htmlFor="contract_number">Vertragsnummer</Label>
                            <Input 
                                id="contract_number"
                                {...register('contract_number')}
                                placeholder="VT-789012"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="contract_date">Vertragsdatum</Label>
                        <Input 
                            id="contract_date"
                            type="date"
                            {...register('contract_date')}
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

            <BookingPreviewDialog
                open={bookingPreviewOpen}
                onOpenChange={setBookingPreviewOpen}
                sourceType="Versorger"
                sourceId={savedSupplierId}
                onSuccess={() => {
                    setBookingPreviewOpen(false);
                    onOpenChange(false);
                }}
            />
        </Dialog>
    );
}