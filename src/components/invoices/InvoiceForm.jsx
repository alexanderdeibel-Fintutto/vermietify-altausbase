import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Upload, Loader2, Sparkles, Info, Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import RecipientForm from '@/components/recipients/RecipientForm';

export default function InvoiceForm({ open, onOpenChange, invoice, buildings, units, contracts, onSuccess }) {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [analyzingAI, setAnalyzingAI] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [invoiceDate, setInvoiceDate] = useState(invoice?.invoice_date ? parseISO(invoice.invoice_date) : null);
    const [dueDate, setDueDate] = useState(invoice?.due_date ? parseISO(invoice.due_date) : null);
    const [recipientFormOpen, setRecipientFormOpen] = useState(false);
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: invoice || {
            type: 'expense',
            invoice_date: '',
            due_date: '',
            amount: '',
            currency: 'EUR',
            recipient: '',
            reference: '',
            description: '',
            unit_id: '',
            building_id: '',
            related_to_contract_id: '',
            cost_type_id: '',
            accounting_notes: '',
            operating_cost_relevant: false,
            document_url: '',
            status: 'pending',
            notes: ''
        }
    });

    // Fetch cost types and EÜR categories
    const { data: costTypes = [] } = useQuery({
        queryKey: ['cost-types'],
        queryFn: () => base44.entities.CostType.list()
    });

    const { data: euerCategories = [] } = useQuery({
        queryKey: ['euer-categories'],
        queryFn: () => base44.entities.EuerCategory.list()
    });

    // Fetch existing invoices to get unique recipients
    const { data: existingInvoices = [] } = useQuery({
        queryKey: ['invoices-recipients'],
        queryFn: () => base44.entities.Invoice.list()
    });

    // Fetch saved recipients
    const { data: savedRecipients = [] } = useQuery({
        queryKey: ['recipients'],
        queryFn: () => base44.entities.Recipient.list()
    });

    // Get unique recipients from both invoices and saved recipients
    const uniqueRecipients = React.useMemo(() => {
        const recipients = new Set();
        existingInvoices.forEach(inv => {
            if (inv.recipient) recipients.add(inv.recipient);
        });
        savedRecipients.forEach(saved => {
            if (saved.name) recipients.add(saved.name);
        });
        return Array.from(recipients).sort();
    }, [existingInvoices, savedRecipients]);

    // Create recipient mutation
    const createRecipientMutation = useMutation({
        mutationFn: (data) => base44.entities.Recipient.create(data),
        onSuccess: (newRecipient) => {
            queryClient.invalidateQueries({ queryKey: ['recipients'] });
            setValue('recipient', newRecipient.name);
            setRecipientFormOpen(false);
            toast.success('Empfänger erstellt und ausgewählt');
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen des Empfängers');
            console.error(error);
        }
    });

    const selectedBuildingId = watch('building_id');
    const selectedUnitId = watch('unit_id');
    const selectedCostTypeId = watch('cost_type_id');
    const watchedType = watch('type');
    const watchedDescription = watch('description');
    const watchedReference = watch('reference');

    // Filter units based on selected building
    const filteredUnits = selectedBuildingId 
        ? units.filter(u => u.building_id === selectedBuildingId)
        : units;

    // Filter contracts based on selected unit
    const filteredContracts = selectedUnitId 
        ? contracts.filter(c => c.unit_id === selectedUnitId && c.status === 'active')
        : contracts.filter(c => c.status === 'active');

    // Get selected cost type details
    const selectedCostType = costTypes.find(ct => ct.id === selectedCostTypeId);
    const selectedEuerCategory = selectedCostType 
        ? euerCategories.find(ec => ec.id === selectedCostType.euer_category_id)
        : null;

    // Filter cost types based on invoice type
    const filteredCostTypes = costTypes.filter(ct => ct.type === watchedType);

    // Auto-set operating_cost_relevant when cost type changes
    useEffect(() => {
        if (selectedCostType) {
            setValue('operating_cost_relevant', selectedCostType.distributable || false);
        }
    }, [selectedCostType, setValue]);

    // AI-based cost type suggestions
    const getAISuggestions = async () => {
        const description = watchedDescription?.trim();
        const reference = watchedReference?.trim();
        
        if (!description && !reference) {
            toast.error('Bitte geben Sie zuerst eine Beschreibung oder Referenz ein');
            return;
        }

        setAnalyzingAI(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analysiere diese Rechnungsinformation und schlage die passendste Kostenart vor.

Rechnungsdetails:
- Beschreibung: ${description || 'keine'}
- Referenz/Verwendungszweck: ${reference || 'keine'}
- Typ: ${watchedType === 'expense' ? 'Ausgabe' : 'Einnahme'}

Verfügbare Kostenarten:
${filteredCostTypes.map(ct => `- ID: ${ct.id}, Hauptkategorie: ${ct.main_category}, Kategorie: ${ct.sub_category}`).join('\n')}

Analysiere die Rechnung und gib die ID der am besten passenden Kostenart zurück. Berücksichtige dabei den Kontext und typische Kategorisierungen im Immobilienverwaltungs-Bereich.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggested_cost_type_id: { type: "string" },
                        confidence: { type: "number" },
                        reasoning: { type: "string" }
                    }
                }
            });

            if (response.suggested_cost_type_id) {
                const suggestedCostType = costTypes.find(ct => ct.id === response.suggested_cost_type_id);
                if (suggestedCostType) {
                    setAiSuggestions({
                        costType: suggestedCostType,
                        confidence: response.confidence || 0,
                        reasoning: response.reasoning || ''
                    });
                    toast.success('KI-Vorschlag gefunden');
                } else {
                    toast.error('Vorgeschlagene Kostenart nicht gefunden');
                }
            }
        } catch (error) {
            console.error('AI suggestion error:', error);
            toast.error('Fehler beim Abrufen von KI-Vorschlägen');
        } finally {
            setAnalyzingAI(false);
        }
    };

    const applySuggestion = () => {
        if (aiSuggestions?.costType) {
            setValue('cost_type_id', aiSuggestions.costType.id);
            setAiSuggestions(null);
            toast.success('Vorschlag angewendet');
        }
    };

    useEffect(() => {
        if (open) {
            reset(invoice || {
                type: 'expense',
                invoice_date: '',
                due_date: '',
                amount: '',
                currency: 'EUR',
                reference: '',
                description: '',
                unit_id: '',
                building_id: '',
                related_to_contract_id: '',
                cost_type_id: '',
                accounting_notes: '',
                operating_cost_relevant: false,
                document_url: '',
                status: 'pending',
                notes: ''
            });
            setInvoiceDate(invoice?.invoice_date ? parseISO(invoice.invoice_date) : null);
            setDueDate(invoice?.due_date ? parseISO(invoice.due_date) : null);
            setAiSuggestions(null);
        }
    }, [open, invoice, reset]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setValue('document_url', file_url);
            toast.success('Dokument hochgeladen');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Fehler beim Hochladen');
        } finally {
            setUploading(false);
        }
    };

    const handleRecipientSubmit = (data) => {
        createRecipientMutation.mutate(data);
    };

    const onSubmit = async (data) => {
        // Manual validation for custom fields
        let hasErrors = false;
        
        if (!invoiceDate) {
            setValue('invoice_date', '', { shouldValidate: true });
            errors.invoice_date = { message: 'Rechnungsdatum ist erforderlich' };
            hasErrors = true;
        }
        
        if (!data.cost_type_id) {
            errors.cost_type_id = { message: 'Kostenart ist erforderlich' };
            hasErrors = true;
        }

        if (hasErrors) {
            toast.error('Bitte füllen Sie alle Pflichtfelder aus');
            return;
        }

        const submissionData = {
            ...data,
            invoice_date: invoiceDate ? format(invoiceDate, 'yyyy-MM-dd') : null,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
            amount: parseFloat(data.amount),
            operating_cost_relevant: data.operating_cost_relevant || false,
        };

        // Remove category field if it exists (we use cost_type_id now)
        delete submissionData.category;
        
        try {
            await onSuccess(submissionData);
        } catch (error) {
            console.error('Error in onSuccess:', error);
            toast.error('Fehler beim Erstellen: ' + error.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {invoice ? 'Rechnung bearbeiten' : 'Neue Rechnung/Beleg erstellen'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Section 1: Grundlegende Informationen */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Grundlegende Informationen
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Type */}
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

                            {/* Invoice Date */}
                            <div>
                                <Label>Rechnungsdatum *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={`w-full justify-start ${!invoiceDate && errors.invoice_date ? 'border-red-500' : ''}`}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {invoiceDate ? format(invoiceDate, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={invoiceDate}
                                            onSelect={setInvoiceDate}
                                            locale={de}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {!invoiceDate && errors.invoice_date && (
                                    <p className="text-xs text-red-600 mt-1">{errors.invoice_date.message}</p>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <Label>Fälligkeitsdatum</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dueDate ? format(dueDate, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate}
                                            onSelect={setDueDate}
                                            locale={de}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Amount */}
                            <div>
                                <Label>Betrag (€) *</Label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...register('amount', { 
                                        required: 'Betrag ist erforderlich',
                                        min: { value: 0.01, message: 'Betrag muss größer als 0 sein' }
                                    })} 
                                    placeholder="0.00"
                                    className={errors.amount ? 'border-red-500' : ''}
                                />
                                {errors.amount && (
                                    <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>
                                )}
                            </div>

                            {/* Currency */}
                            <div>
                                <Label>Währung</Label>
                                <Select 
                                    value={watch('currency')} 
                                    onValueChange={(value) => setValue('currency', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Recipient with autocomplete and add button */}
                            <div className="md:col-span-2">
                                <Label>Empfänger/Aussteller *</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <input
                                            list="recipients-list"
                                            {...register('recipient')}
                                            placeholder="z.B. Stadtwerke, Versicherung AG..."
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <datalist id="recipients-list">
                                            {uniqueRecipients.map((recipient, idx) => (
                                                <option key={idx} value={recipient} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setRecipientFormOpen(true)}
                                        className="gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Neu
                                    </Button>
                                </div>
                            </div>

                            {/* Reference */}
                            <div>
                                <Label>Rechnungsnummer/Referenz</Label>
                                <Input {...register('reference')} placeholder="RE-12345" />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label>Beschreibung/Leistung *</Label>
                            <Textarea 
                                {...register('description', { required: 'Beschreibung ist erforderlich' })} 
                                placeholder="z.B. Stromrechnung Dezember 2024, Hausmeisterdienste..."
                                className={`h-20 ${errors.description ? 'border-red-500' : ''}`}
                            />
                            {errors.description && (
                                <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Kostenart & Kategorisierung */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-sm font-semibold text-slate-700">
                                Kostenart & Kategorisierung
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={getAISuggestions}
                                disabled={analyzingAI || (!watchedDescription && !watchedReference)}
                                className="gap-2"
                            >
                                {analyzingAI ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analysiere...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        KI-Vorschlag
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* AI Suggestions Card */}
                        {aiSuggestions && (
                            <Card className="p-4 bg-blue-50 border-blue-200">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-slate-800 mb-1">
                                            KI-Vorschlag
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-white">
                                                    {aiSuggestions.costType.main_category}
                                                </Badge>
                                                <span className="text-sm">→</span>
                                                <Badge className="bg-blue-600">
                                                    {aiSuggestions.costType.sub_category}
                                                </Badge>
                                                <Badge variant="outline" className="ml-auto">
                                                    {Math.round(aiSuggestions.confidence)}% sicher
                                                </Badge>
                                            </div>
                                            {aiSuggestions.reasoning && (
                                                <p className="text-xs text-slate-600 mt-2">
                                                    <Info className="w-3 h-3 inline mr-1" />
                                                    {aiSuggestions.reasoning}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={applySuggestion}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Übernehmen
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setAiSuggestions(null)}
                                        >
                                            Ignorieren
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {/* Cost Type Selection */}
                            <div>
                                <Label>Kostenart *</Label>
                                <Select 
                                    value={watch('cost_type_id')} 
                                    onValueChange={(value) => setValue('cost_type_id', value)}
                                >
                                    <SelectTrigger className={!watch('cost_type_id') && errors.cost_type_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Kostenart auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80">
                                        {/* Group by main_category */}
                                        {Object.entries(
                                            filteredCostTypes.reduce((acc, ct) => {
                                                if (!acc[ct.main_category]) acc[ct.main_category] = [];
                                                acc[ct.main_category].push(ct);
                                                return acc;
                                            }, {})
                                        ).map(([mainCategory, types]) => (
                                            <React.Fragment key={mainCategory}>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                                                    {mainCategory}
                                                </div>
                                                {types.map(ct => (
                                                    <SelectItem key={ct.id} value={ct.id}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{ct.sub_category}</span>
                                                            {ct.distributable && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    umlagefähig
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    {!watch('cost_type_id') && errors.cost_type_id && (
                                    <p className="text-xs text-red-600 mt-1">{errors.cost_type_id.message}</p>
                                    )}
                                    </div>

                                    {/* EÜR Category Display (read-only) */}
                            {selectedCostType && selectedEuerCategory && (
                                <div>
                                    <Label>EÜR-Kategorie (automatisch)</Label>
                                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-slate-700">
                                                {selectedEuerCategory.parent_category}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {selectedEuerCategory.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cost Type Details */}
                            {selectedCostType && (
                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCostType.vat_rate > 0 && (
                                            <Badge variant="outline">
                                                MwSt: {(selectedCostType.vat_rate * 100).toFixed(0)}%
                                            </Badge>
                                        )}
                                        {selectedCostType.distributable && (
                                            <Badge className="bg-blue-100 text-blue-700">
                                                Umlagefähig ({selectedCostType.distribution_key})
                                            </Badge>
                                        )}
                                        {selectedCostType.tax_deductible && (
                                            <Badge className="bg-green-100 text-green-700">
                                                Steuerlich absetzbar
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Objekt-Zuordnung */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Objekt-Zuordnung (optional)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Building */}
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
                                        <SelectValue placeholder="Gebäude auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buildings.map(building => (
                                            <SelectItem key={building.id} value={building.id}>
                                                {building.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Unit */}
                            <div>
                                <Label>Wohneinheit</Label>
                                <Select 
                                    value={watch('unit_id')} 
                                    onValueChange={(value) => {
                                        setValue('unit_id', value);
                                        setValue('related_to_contract_id', '');
                                    }}
                                    disabled={!selectedBuildingId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wohneinheit auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredUnits.map(unit => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.unit_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Contract */}
                            <div className="md:col-span-2">
                                <Label>Mietvertrag</Label>
                                <Select 
                                    value={watch('related_to_contract_id')} 
                                    onValueChange={(value) => setValue('related_to_contract_id', value)}
                                    disabled={!selectedUnitId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Mietvertrag auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredContracts.map(contract => (
                                            <SelectItem key={contract.id} value={contract.id}>
                                                Vertrag vom {contract.start_date ? format(parseISO(contract.start_date), 'dd.MM.yyyy', { locale: de }) : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Buchhaltung & Status */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                            Buchhaltung & Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Status */}
                            <div>
                                <Label>Zahlungsstatus</Label>
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

                            {/* Operating Cost Relevant - auto from cost type */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="operating_cost_relevant"
                                    {...register('operating_cost_relevant')}
                                    disabled={!!selectedCostType?.distributable}
                                    className="w-4 h-4 rounded border-slate-300 disabled:opacity-50"
                                />
                                <Label 
                                    htmlFor="operating_cost_relevant" 
                                    className={`cursor-pointer ${selectedCostType?.distributable ? 'text-slate-500' : ''}`}
                                >
                                    Relevant für Betriebskostenabrechnung
                                    {selectedCostType?.distributable && (
                                        <span className="ml-2 text-xs">(automatisch von Kostenart)</span>
                                    )}
                                </Label>
                            </div>

                            {/* Document Upload */}
                            <div className="md:col-span-2">
                                <Label>Dokument hochladen</Label>
                                <div className="flex gap-2 items-center mt-2">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="flex-1"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                </div>
                                {watch('document_url') && (
                                    <a 
                                        href={watch('document_url')} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-1 block"
                                    >
                                        Dokument ansehen
                                    </a>
                                )}
                            </div>

                            {/* Accounting Notes */}
                            <div className="md:col-span-2">
                                <Label>Buchhaltungsnotizen</Label>
                                <Textarea 
                                    {...register('accounting_notes')} 
                                    placeholder="Interne Notizen für die Buchhaltung..."
                                    className="h-20"
                                />
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <Label>Allgemeine Notizen</Label>
                                <Textarea 
                                    {...register('notes')} 
                                    placeholder="Weitere Notizen..."
                                    className="h-20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Abbrechen
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                            {invoice ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>

            {/* Recipient Form Dialog */}
            <RecipientForm
                open={recipientFormOpen}
                onOpenChange={setRecipientFormOpen}
                recipient={null}
                onSuccess={handleRecipientSubmit}
                isLoading={createRecipientMutation.isPending}
            />
        </Dialog>
    );
}