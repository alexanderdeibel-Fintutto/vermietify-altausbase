import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Upload, Loader2, Plus, BookOpen, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import RecipientForm from '@/components/recipients/RecipientForm';
import TaxCategoryPicker from '@/components/tax-library/TaxCategoryPicker';
import TaxLibraryInstallDialog from '@/components/tax-library/TaxLibraryInstallDialog';

export default function InvoiceFormWithTaxLibrary({ open, onOpenChange, invoice, buildings, units, contracts, onSuccess }) {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [invoiceDate, setInvoiceDate] = useState(invoice?.invoice_date ? parseISO(invoice.invoice_date) : null);
    const [dueDate, setDueDate] = useState(invoice?.due_date ? parseISO(invoice.due_date) : null);
    const [afaStartDate, setAfaStartDate] = useState(invoice?.afa_start_date ? parseISO(invoice.afa_start_date) : null);
    const [recipientFormOpen, setRecipientFormOpen] = useState(false);
    const [installDialogOpen, setInstallDialogOpen] = useState(false);
    const [selectedTaxCategory, setSelectedTaxCategory] = useState(invoice?.cost_category_id || '');

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
            cost_category_id: '',
            afa_duration: '',
            afa_start_date: '',
            distribution_years: '',
            accounting_notes: '',
            operating_cost_relevant: false,
            document_url: '',
            status: 'pending',
            notes: ''
        }
    });

    const { data: savedRecipients = [] } = useQuery({
        queryKey: ['recipients'],
        queryFn: () => base44.entities.Recipient.list()
    });

    const { data: existingInvoices = [] } = useQuery({
        queryKey: ['invoices-recipients'],
        queryFn: () => base44.entities.Invoice.list()
    });

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

    const createRecipientMutation = useMutation({
        mutationFn: (data) => base44.entities.Recipient.create(data),
        onSuccess: (newRecipient) => {
            queryClient.invalidateQueries({ queryKey: ['recipients'] });
            setValue('recipient', newRecipient.name);
            setRecipientFormOpen(false);
            toast.success('Empfänger erstellt und ausgewählt');
        }
    });

    const selectedBuildingId = watch('building_id');
    const selectedUnitId = watch('unit_id');
    const watchedAmount = watch('amount');

    // Tax Library für ausgewähltes Gebäude
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

    const { data: taxLibrary } = useQuery({
        queryKey: ['taxLibrary', selectedBuildingId],
        queryFn: async () => {
            const { data } = await base44.functions.invoke('getTaxLibrary', { building_id: selectedBuildingId });
            return data;
        },
        enabled: !!selectedBuildingId,
        retry: false
    });

    // Selected category details
    const { data: categoryDetails } = useQuery({
        queryKey: ['categoryDetails', selectedBuildingId, selectedTaxCategory],
        queryFn: async () => {
            const { data } = await base44.functions.invoke('getCostCategory', {
                building_id: selectedBuildingId,
                cost_category_id: selectedTaxCategory
            });
            return data;
        },
        enabled: !!selectedBuildingId && !!selectedTaxCategory
    });

    // Filter units based on selected building
    const filteredUnits = selectedBuildingId 
        ? units.filter(u => u.building_id === selectedBuildingId)
        : units;

    // Filter contracts based on selected unit
    const filteredContracts = selectedUnitId 
        ? contracts.filter(c => c.unit_id === selectedUnitId && c.status === 'active')
        : contracts.filter(c => c.status === 'active');

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
                cost_category_id: '',
                afa_duration: '',
                afa_start_date: '',
                distribution_years: '',
                accounting_notes: '',
                operating_cost_relevant: false,
                document_url: '',
                status: 'pending',
                notes: ''
            });
            setInvoiceDate(invoice?.invoice_date ? parseISO(invoice.invoice_date) : null);
            setDueDate(invoice?.due_date ? parseISO(invoice.due_date) : null);
            setAfaStartDate(invoice?.afa_start_date ? parseISO(invoice.afa_start_date) : null);
            setSelectedTaxCategory(invoice?.cost_category_id || '');
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
        if (!invoiceDate) {
            toast.error('Rechnungsdatum ist erforderlich');
            return;
        }

        if (!selectedBuildingId) {
            toast.error('Gebäude ist erforderlich');
            return;
        }

        if (!selectedTaxCategory) {
            toast.error('Steuerkategorie ist erforderlich');
            return;
        }

        const amount = parseFloat(data.amount);
        const submissionData = {
            ...data,
            invoice_date: invoiceDate ? format(invoiceDate, 'yyyy-MM-dd') : null,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
            afa_start_date: afaStartDate ? format(afaStartDate, 'yyyy-MM-dd') : null,
            amount: amount,
            cost_category_id: selectedTaxCategory,
            afa_duration: data.afa_duration ? parseInt(data.afa_duration) : null,
            distribution_years: data.distribution_years ? parseInt(data.distribution_years) : null,
            operating_cost_relevant: data.operating_cost_relevant || false,
        };

        if (!invoice) {
            submissionData.expected_amount = amount;
            submissionData.paid_amount = 0;
        }

        delete submissionData.category;
        
        onSuccess(submissionData);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {invoice ? 'Rechnung bearbeiten' : 'Neue Rechnung/Beleg erstellen'}
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                                Mit Steuerbibliothek
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Grundinformationen */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                                Grundinformationen
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
                                            <SelectItem value="expense">Ausgabe</SelectItem>
                                            <SelectItem value="other_income">Sonstige Einnahme</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Rechnungsdatum *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
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
                                </div>

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

                                <div className="md:col-span-2">
                                    <Label>Empfänger/Aussteller *</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <input
                                                list="recipients-list"
                                                {...register('recipient', { required: 'Empfänger ist erforderlich' })}
                                                placeholder="z.B. Stadtwerke, Versicherung AG..."
                                                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ${errors.recipient ? 'border-red-500' : 'border-slate-300'}`}
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
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Neu
                                        </Button>
                                    </div>
                                    {errors.recipient && (
                                        <p className="text-xs text-red-600 mt-1">{errors.recipient.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Rechnungsnummer/Referenz</Label>
                                    <Input {...register('reference')} placeholder="RE-12345" />
                                </div>
                            </div>

                            <div>
                                <Label>Beschreibung/Leistung *</Label>
                                <Textarea 
                                    {...register('description', { required: 'Beschreibung ist erforderlich' })} 
                                    placeholder="z.B. Heizungswartung, Stromrechnung..."
                                    className={`h-20 ${errors.description ? 'border-red-500' : ''}`}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Objekt-Zuordnung */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                                Objekt-Zuordnung
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Gebäude *</Label>
                                    <Select 
                                        value={watch('building_id')} 
                                        onValueChange={(value) => {
                                            setValue('building_id', value);
                                            setValue('unit_id', '');
                                            setValue('related_to_contract_id', '');
                                            setSelectedTaxCategory('');
                                        }}
                                    >
                                        <SelectTrigger className={!watch('building_id') ? 'border-red-500' : ''}>
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
                                            <SelectItem value={null}>Keine (gebäudeweit)</SelectItem>
                                            {filteredUnits.map(unit => (
                                                <SelectItem key={unit.id} value={unit.id}>
                                                    {unit.unit_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

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
                                            <SelectItem value={null}>Kein Vertrag</SelectItem>
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

                        {/* Steuerkategorie */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Steuerkategorie
                                </h3>
                                {selectedBuildingId && !taxLibrary && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setInstallDialogOpen(true)}
                                        className="gap-2"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Bibliothek installieren
                                    </Button>
                                )}
                            </div>

                            {selectedBuildingId ? (
                                taxLibrary ? (
                                    <TaxCategoryPicker
                                        buildingId={selectedBuildingId}
                                        value={selectedTaxCategory}
                                        onChange={setSelectedTaxCategory}
                                        amount={watchedAmount}
                                    />
                                ) : (
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <BookOpen className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-900">
                                            <p className="font-medium">Steuerbibliothek noch nicht installiert</p>
                                            <p className="text-sm mt-1">
                                                Installieren Sie die Steuerbibliothek für automatische Kontenzuordnung und steuerliche Behandlung.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setInstallDialogOpen(true)}
                                                className="mt-3"
                                            >
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                Jetzt installieren
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                )
                            ) : (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Bitte wählen Sie zuerst ein Gebäude aus
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Zusatzfelder bei AfA */}
                            {categoryDetails?.tax_treatment === 'AFA' && (
                                <Card className="p-4 bg-purple-50 border-purple-200">
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-purple-900">
                                            Abschreibung (AfA) erforderlich
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>AfA-Dauer (Jahre)</Label>
                                                <Input
                                                    type="number"
                                                    {...register('afa_duration')}
                                                    defaultValue={categoryDetails.standard_depreciation_years}
                                                    placeholder={categoryDetails.standard_depreciation_years?.toString()}
                                                />
                                                <p className="text-xs text-purple-700 mt-1">
                                                    Standard: {categoryDetails.standard_depreciation_years} Jahre
                                                </p>
                                            </div>
                                            <div>
                                                <Label>AfA-Beginn</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-start">
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {afaStartDate ? format(afaStartDate, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={afaStartDate}
                                                            onSelect={setAfaStartDate}
                                                            locale={de}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* 15%-Regel: Verteilung */}
                            {categoryDetails?.type === 'ERHALTUNG' && (
                                <div>
                                    <Label>Verteilung (§6b EStG)</Label>
                                    <Select 
                                        value={watch('distribution_years') || ''} 
                                        onValueChange={(value) => setValue('distribution_years', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Keine Verteilung (sofort absetzbar)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>Keine (sofort absetzbar)</SelectItem>
                                            <SelectItem value="2">Verteilt über 2 Jahre</SelectItem>
                                            <SelectItem value="3">Verteilt über 3 Jahre</SelectItem>
                                            <SelectItem value="4">Verteilt über 4 Jahre</SelectItem>
                                            <SelectItem value="5">Verteilt über 5 Jahre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Bei Überschreitung der 15%-Grenze optional
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Buchhaltung & Dokument */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                                Buchhaltung & Dokument
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            <SelectItem value="partial">Teilzahlung</SelectItem>
                                            <SelectItem value="paid">Bezahlt</SelectItem>
                                            <SelectItem value="overdue">Überfällig</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="operating_cost_relevant"
                                        {...register('operating_cost_relevant')}
                                        disabled={categoryDetails?.can_be_allocated === false}
                                        className="w-4 h-4 rounded"
                                    />
                                    <Label htmlFor="operating_cost_relevant">
                                        Betriebskostenrelevant
                                        {categoryDetails?.can_be_allocated === false && (
                                            <span className="ml-2 text-xs text-slate-500">(nicht umlagefähig)</span>
                                        )}
                                    </Label>
                                </div>

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

                                <div className="md:col-span-2">
                                    <Label>Buchhaltungsnotizen</Label>
                                    <Textarea 
                                        {...register('accounting_notes')} 
                                        placeholder="Interne Notizen..."
                                        className="h-16"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label>Weitere Notizen</Label>
                                    <Textarea 
                                        {...register('notes')} 
                                        placeholder="Weitere Notizen..."
                                        className="h-16"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Abbrechen
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={!selectedBuildingId || !selectedTaxCategory}
                            >
                                {invoice ? 'Speichern' : 'Erstellen'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Tax Library Install Dialog */}
            {selectedBuilding && (
                <TaxLibraryInstallDialog
                    building={selectedBuilding}
                    open={installDialogOpen}
                    onOpenChange={setInstallDialogOpen}
                />
            )}

            {/* Recipient Form */}
            <RecipientForm
                open={recipientFormOpen}
                onOpenChange={setRecipientFormOpen}
                recipient={null}
                onSuccess={handleRecipientSubmit}
                isLoading={createRecipientMutation.isPending}
            />
        </>
    );
}