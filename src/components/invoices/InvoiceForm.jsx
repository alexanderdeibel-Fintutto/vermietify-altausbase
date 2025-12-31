import React, { useState, useEffect } from 'react';
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
import { Building2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const categoryLabels = {
    maintenance: 'Instandhaltung/Reparatur',
    utilities: 'Nebenkosten (Strom, Wasser, etc.)',
    insurance: 'Versicherungen',
    tax: 'Steuern',
    property_management: 'Hausverwaltung',
    marketing: 'Marketing/Werbung',
    legal: 'Rechtsberatung',
    financing: 'Finanzierung/Zinsen',
    other_expense: 'Sonstige Ausgabe',
    other_income: 'Sonstige Einnahme'
};

export default function InvoiceForm({ open, onOpenChange, invoice, buildings, units, contracts, onSuccess }) {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: invoice || {
            type: 'expense',
            currency: 'EUR',
            status: 'pending',
            operating_cost_relevant: false
        }
    });

    const [uploadingFile, setUploadingFile] = useState(false);
    const [documentFile, setDocumentFile] = useState(null);

    const selectedType = watch('type');
    const selectedBuildingId = watch('building_id');
    const selectedUnitId = watch('unit_id');
    const selectedCostTypeId = watch('cost_type_id');
    const watchedType = watch('type');
    const watchedDescription = watch('description');
    const watchedReference = watch('reference');

    useEffect(() => {
        if (invoice) {
            reset(invoice);
        } else {
            reset({
                type: 'expense',
                currency: 'EUR',
                status: 'pending',
                operating_cost_relevant: false
            });
        }
    }, [invoice, reset]);

    // Filter units based on selected building
    const filteredUnits = selectedBuildingId 
        ? units.filter(u => u.building_id === selectedBuildingId)
        : units;

    // Filter contracts based on selected unit
    const filteredContracts = selectedUnitId
        ? contracts.filter(c => c.unit_id === selectedUnitId && c.status === 'active')
        : [];

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setValue('document_url', file_url);
            setDocumentFile(file);
            toast.success('Dokument hochgeladen');
        } catch (error) {
            toast.error('Fehler beim Hochladen');
            console.error(error);
        } finally {
            setUploadingFile(false);
        }
    };

    const onSubmit = (data) => {
        // Validate that either unit_id or building_id is set
        if (!data.unit_id && !data.building_id) {
            toast.error('Bitte wählen Sie ein Objekt (Gebäude oder Wohneinheit)');
            return;
        }

        onSuccess({
            ...data,
            amount: parseFloat(data.amount),
            building_id: data.building_id || null,
            unit_id: data.unit_id || null,
            related_to_contract_id: data.related_to_contract_id || null
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {invoice ? 'Rechnung/Beleg bearbeiten' : 'Neue Rechnung/Beleg erstellen'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {/* Type Selection */}
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
                                <SelectItem value="expense">Ausgabe</SelectItem>
                                <SelectItem value="other_income">Sonstige Einnahme</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Rechnungsdatum *</Label>
                            <Input 
                                type="date" 
                                {...register('invoice_date', { required: true })}
                            />
                        </div>
                        <div>
                            <Label>Fälligkeitsdatum</Label>
                            <Input 
                                type="date" 
                                {...register('due_date')}
                            />
                        </div>
                    </div>

                    {/* Amount and Currency */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <Label>Betrag *</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                {...register('amount', { required: true })}
                            />
                        </div>
                        <div>
                            <Label>Währung</Label>
                            <Input 
                                {...register('currency')}
                                placeholder="EUR"
                            />
                        </div>
                    </div>

                    {/* Reference and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Rechnungsnummer/Referenz</Label>
                            <Input 
                                {...register('reference')}
                                placeholder="RE-2024-001"
                            />
                        </div>
                        <div>
                            <Label>Kategorie *</Label>
                            <Select 
                                value={watch('category')} 
                                onValueChange={(value) => setValue('category', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategorie wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categoryLabels)
                                        .filter(([key]) => {
                                            if (selectedType === 'expense') {
                                                return key !== 'other_income';
                                            } else {
                                                return key === 'other_income';
                                            }
                                        })
                                        .map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label>Beschreibung/Verwendungszweck *</Label>
                        <Textarea 
                            {...register('description', { required: true })}
                            placeholder="Beschreibung der Rechnung..."
                            rows={3}
                        />
                    </div>

                    {/* Object Selection */}
                    <div className="border-t pt-4">
                        <Label className="text-base font-semibold mb-3 block">Objektzuordnung *</Label>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Gebäude</Label>
                                <Select 
                                    value={watch('building_id')} 
                                    onValueChange={(value) => {
                                        setValue('building_id', value);
                                        setValue('unit_id', '');
                                        setValue('related_to_contract_id', '');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Gebäude wählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buildings.map(building => (
                                            <SelectItem key={building.id} value={building.id}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4" />
                                                    {building.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Wohneinheit (optional)</Label>
                                <Select 
                                    value={watch('unit_id')} 
                                    onValueChange={(value) => {
                                        setValue('unit_id', value);
                                        setValue('related_to_contract_id', '');
                                    }}
                                    disabled={!selectedBuildingId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Einheit wählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Keine Einheit</SelectItem>
                                        {filteredUnits.map(unit => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.unit_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Contract Selection */}
                        {selectedUnitId && filteredContracts.length > 0 && (
                            <div className="mt-4">
                                <Label>Mietvertrag (optional)</Label>
                                <Select 
                                    value={watch('related_to_contract_id')} 
                                    onValueChange={(value) => setValue('related_to_contract_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Vertrag wählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Kein Vertrag</SelectItem>
                                        {filteredContracts.map(contract => (
                                            <SelectItem key={contract.id} value={contract.id}>
                                                Vertrag: {contract.tenant_id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Accounting Details */}
                    <div className="border-t pt-4">
                        <Label className="text-base font-semibold mb-3 block">Buchhaltung</Label>
                        
                        <div className="space-y-4">
                            <div>
                                <Label>Buchhaltungsnotizen</Label>
                                <Textarea 
                                    {...register('accounting_notes')}
                                    placeholder="Spezielle Notizen für die Buchhaltung..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <Label>Betriebskostenrelevant</Label>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Wird diese Ausgabe/Einnahme bei der Betriebskostenabrechnung berücksichtigt?
                                    </p>
                                </div>
                                <Switch 
                                    checked={watch('operating_cost_relevant')}
                                    onCheckedChange={(checked) => setValue('operating_cost_relevant', checked)}
                                />
                            </div>

                            <div>
                                <Label>Status</Label>
                                <Select 
                                    value={watch('status')} 
                                    onValueChange={(value) => setValue('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Ausstehend</SelectItem>
                                        <SelectItem value="paid">Bezahlt</SelectItem>
                                        <SelectItem value="overdue">Überfällig</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div className="border-t pt-4">
                        <Label>Dokument</Label>
                        <div className="mt-2">
                            {watch('document_url') ? (
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <span className="text-sm text-emerald-700 flex-1">
                                        Dokument hochgeladen
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setValue('document_url', '');
                                            setDocumentFile(null);
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="document-upload"
                                        disabled={uploadingFile}
                                    />
                                    <label htmlFor="document-upload">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={uploadingFile}
                                            asChild
                                        >
                                            <span>
                                                <Upload className="w-4 h-4 mr-2" />
                                                {uploadingFile ? 'Wird hochgeladen...' : 'Dokument hochladen'}
                                            </span>
                                        </Button>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* General Notes */}
                    <div>
                        <Label>Allgemeine Notizen</Label>
                        <Textarea 
                            {...register('notes')}
                            placeholder="Weitere Notizen..."
                            rows={2}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                            {invoice ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}