import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function CostTypeForm({ open, onOpenChange, costType, euerCategories, existingMainCategories = [], onSuccess }) {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: costType || {
            type: 'expense',
            vat_rate: 0,
            distributable: false,
            distribution_key: 'none',
            tax_deductible: false
        }
    });

    const selectedType = watch('type');
    const isDistributable = watch('distributable');
    const [isNewMainCategory, setIsNewMainCategory] = React.useState(false);

    useEffect(() => {
        if (costType) {
            reset(costType);
        } else {
            reset({
                type: 'expense',
                vat_rate: 0,
                distributable: false,
                distribution_key: 'none',
                tax_deductible: false
            });
        }
    }, [costType, reset]);

    const onSubmit = (data) => {
        onSuccess({
            ...data,
            vat_rate: parseFloat(data.vat_rate),
            distribution_key: data.distributable ? data.distribution_key : 'none'
        });
    };

    // Filter EÜR categories by type
    const filteredEuerCategories = euerCategories.filter(ec => 
        selectedType === 'income' ? ec.is_income : !ec.is_income
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {costType ? 'Kostenart bearbeiten' : 'Neue Kostenart erstellen'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {/* Type */}
                    <div>
                        <Label>Typ *</Label>
                        <Select 
                            value={watch('type')} 
                            onValueChange={(value) => {
                                setValue('type', value);
                                setValue('euer_category_id', '');
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Ausgabe</SelectItem>
                                <SelectItem value="income">Einnahme</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Main Category */}
                    <div>
                        <Label>Hauptkategorie *</Label>
                        {isNewMainCategory ? (
                            <div className="space-y-2">
                                <Input 
                                    {...register('main_category', { required: true })}
                                    placeholder="Neue Hauptkategorie eingeben..."
                                />
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        setIsNewMainCategory(false);
                                        setValue('main_category', '');
                                    }}
                                >
                                    Aus bestehenden wählen
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Select 
                                    value={watch('main_category')} 
                                    onValueChange={(value) => {
                                        if (value === '__new__') {
                                            setIsNewMainCategory(true);
                                            setValue('main_category', '');
                                        } else {
                                            setValue('main_category', value);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Hauptkategorie wählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__new__" className="text-emerald-600 font-medium">
                                            + Neue Hauptkategorie
                                        </SelectItem>
                                        {existingMainCategories.length > 0 && (
                                            <>
                                                <div className="border-t my-1" />
                                                {existingMainCategories.map(cat => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Sub Category */}
                    <div>
                        <Label>Kategorie *</Label>
                        <Input 
                            {...register('sub_category', { required: true })}
                            placeholder="z.B. Algemeinstrom"
                        />
                    </div>

                    {/* VAT Rate */}
                    <div>
                        <Label>MwSt.-Satz</Label>
                        <Select 
                            value={watch('vat_rate')?.toString()} 
                            onValueChange={(value) => setValue('vat_rate', parseFloat(value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Nein (0%)</SelectItem>
                                <SelectItem value="0.07">7%</SelectItem>
                                <SelectItem value="0.19">19%</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Distributable */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label>Umlagefähig</Label>
                            <p className="text-xs text-slate-500 mt-1">
                                Kann diese Kostenart auf Mieter umgelegt werden?
                            </p>
                        </div>
                        <Switch 
                            checked={watch('distributable')}
                            onCheckedChange={(checked) => {
                                setValue('distributable', checked);
                                if (!checked) {
                                    setValue('distribution_key', 'none');
                                }
                            }}
                        />
                    </div>

                    {/* Distribution Key */}
                    {isDistributable && (
                        <div>
                            <Label>Umlageschlüssel</Label>
                            <Select 
                                value={watch('distribution_key')} 
                                onValueChange={(value) => setValue('distribution_key', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kein Schlüssel</SelectItem>
                                    <SelectItem value="qm">Quadratmeter (qm)</SelectItem>
                                    <SelectItem value="Personen">Personen</SelectItem>
                                    <SelectItem value="Verbrauch">Verbrauch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* EÜR Category */}
                    <div>
                        <Label>EÜR-Kategorie</Label>
                        <Select 
                            value={watch('euer_category_id')} 
                            onValueChange={(value) => setValue('euer_category_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="EÜR-Kategorie wählen..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                <SelectItem value={null}>Keine Kategorie</SelectItem>
                                {filteredEuerCategories.map(ec => (
                                    <SelectItem key={ec.id} value={ec.id}>
                                        <div>
                                            <p className="font-medium">{ec.parent_category}</p>
                                            <p className="text-xs text-slate-500">{ec.name}</p>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tax Deductible */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label>Steuerlich absetzbar</Label>
                            <p className="text-xs text-slate-500 mt-1">
                                Ist diese Kostenart steuerlich absetzbar?
                            </p>
                        </div>
                        <Switch 
                            checked={watch('tax_deductible')}
                            onCheckedChange={(checked) => setValue('tax_deductible', checked)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                            {costType ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}