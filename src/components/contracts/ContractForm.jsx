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

export default function ContractForm({ 
    open, 
    onOpenChange, 
    onSubmit, 
    initialData, 
    isLoading,
    units = [],
    tenants = []
}) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || { status: 'active', is_unlimited: true, deposit_paid: false, deposit_installments: 1 }
    });

    const watchIsUnlimited = watch('is_unlimited');
    const watchBaseRent = watch('base_rent');
    const watchUtilities = watch('utilities');
    const watchHeating = watch('heating');
    const watchStatus = watch('status');
    const watchUnitId = watch('unit_id');
    const watchTenantId = watch('tenant_id');
    const watchDepositInstallments = watch('deposit_installments');

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ status: 'active', is_unlimited: true, deposit_paid: false, deposit_installments: 1 });
        }
    }, [initialData, reset]);

    React.useEffect(() => {
        const baseRent = parseFloat(watchBaseRent) || 0;
        const utilities = parseFloat(watchUtilities) || 0;
        const heating = parseFloat(watchHeating) || 0;
        setValue('total_rent', baseRent + utilities + heating);
    }, [watchBaseRent, watchUtilities, watchHeating, setValue]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            base_rent: parseFloat(data.base_rent) || 0,
            utilities: parseFloat(data.utilities) || 0,
            heating: parseFloat(data.heating) || 0,
            total_rent: parseFloat(data.total_rent) || 0,
            deposit: data.deposit ? parseFloat(data.deposit) : null,
            deposit_installments: data.deposit_installments ? parseInt(data.deposit_installments) : 1,
            notice_period_months: data.notice_period_months ? parseInt(data.notice_period_months) : null,
            end_date: data.is_unlimited ? null : data.end_date,
            handover_date: data.handover_date || null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Mietvertrag bearbeiten' : 'Neuen Mietvertrag anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="unit_id">Wohnung *</Label>
                            <Select 
                                value={watchUnitId} 
                                onValueChange={(value) => setValue('unit_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wohnung wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.unit_number} ({unit.sqm}m²)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="tenant_id">Mieter *</Label>
                            <Select 
                                value={watchTenantId} 
                                onValueChange={(value) => setValue('tenant_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Mieter wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tenants.map((tenant) => (
                                        <SelectItem key={tenant.id} value={tenant.id}>
                                            {tenant.first_name} {tenant.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="start_date">Mietbeginn *</Label>
                            <Input 
                                id="start_date"
                                type="date"
                                {...register('start_date', { required: true })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="handover_date">Wohnungsübergabe</Label>
                            <Input 
                                id="handover_date"
                                type="date"
                                {...register('handover_date')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select 
                                value={watchStatus} 
                                onValueChange={(value) => setValue('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Aktiv</SelectItem>
                                    <SelectItem value="terminated">Gekündigt</SelectItem>
                                    <SelectItem value="expired">Abgelaufen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <Label htmlFor="is_unlimited">Unbefristeter Vertrag</Label>
                        <Switch 
                            id="is_unlimited"
                            checked={watchIsUnlimited}
                            onCheckedChange={(checked) => setValue('is_unlimited', checked)}
                        />
                    </div>

                    {!watchIsUnlimited && (
                        <div>
                            <Label htmlFor="end_date">Mietende</Label>
                            <Input 
                                id="end_date"
                                type="date"
                                {...register('end_date')}
                            />
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Mietkonditionen</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="base_rent">Kaltmiete (€) *</Label>
                                <Input 
                                    id="base_rent"
                                    type="number"
                                    step="0.01"
                                    {...register('base_rent', { required: true })}
                                    placeholder="650"
                                />
                            </div>
                            <div>
                                <Label htmlFor="utilities">Nebenkosten (€)</Label>
                                <Input 
                                    id="utilities"
                                    type="number"
                                    step="0.01"
                                    {...register('utilities')}
                                    placeholder="120"
                                />
                            </div>
                            <div>
                                <Label htmlFor="heating">Heizkosten (€)</Label>
                                <Input 
                                    id="heating"
                                    type="number"
                                    step="0.01"
                                    {...register('heating')}
                                    placeholder="80"
                                />
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Warmmiete gesamt:</span>
                                <span className="text-lg font-bold text-slate-800">
                                    €{((parseFloat(watchBaseRent) || 0) + 
                                       (parseFloat(watchUtilities) || 0) + 
                                       (parseFloat(watchHeating) || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Kaution & Kündigungsfrist</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="deposit">Kaution (€)</Label>
                                <Input 
                                    id="deposit"
                                    type="number"
                                    step="0.01"
                                    {...register('deposit')}
                                    placeholder="1950"
                                />
                            </div>
                            <div>
                                <Label htmlFor="deposit_installments">Fälligkeit der Kaution</Label>
                                <Select 
                                    value={watchDepositInstallments?.toString()} 
                                    onValueChange={(value) => setValue('deposit_installments', parseInt(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Zahlung</SelectItem>
                                        <SelectItem value="2">2 monatliche Zahlungen</SelectItem>
                                        <SelectItem value="3">3 monatliche Zahlungen</SelectItem>
                                        <SelectItem value="4">4 monatliche Zahlungen</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="notice_period_months">Kündigungsfrist (Monate)</Label>
                                <Input 
                                    id="notice_period_months"
                                    type="number"
                                    {...register('notice_period_months')}
                                    placeholder="3"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <Label htmlFor="deposit_paid">Kaution bezahlt</Label>
                            <Switch 
                                id="deposit_paid"
                                checked={watch('deposit_paid')}
                                onCheckedChange={(checked) => setValue('deposit_paid', checked)}
                            />
                        </div>
                    </div>



                    {watchStatus === 'terminated' && (
                        <div>
                            <Label htmlFor="termination_date">Kündigungsdatum</Label>
                            <Input 
                                id="termination_date"
                                type="date"
                                {...register('termination_date')}
                            />
                        </div>
                    )}

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