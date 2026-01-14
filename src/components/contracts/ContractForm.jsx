import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
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
import { Loader2, Plus, X, Sparkles, HelpCircle } from 'lucide-react';
import PostContractDialog from './PostContractDialog';
import BuchungenGenerierenTooltip from '@/components/shared/BuchungenGenerierenTooltip';
import { ContractWithoutBookingsWarning, HighRentWarning } from '@/components/shared/PlausibilityWarnings';
import HelpTooltip from '@/components/shared/HelpTooltip';
import { generateFinancialItemsForContract, regenerateContractFinancialItems, needsPartialRentDialog, calculatePartialRent } from './generateFinancialItems';
import PartialRentDialog from './PartialRentDialog';
import BookingPreviewDialog from '../bookings/BookingPreviewDialog';
import RentMarketAnalyzer from './RentMarketAnalyzer';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import ContractOverlapWarning from '@/components/shared/ContractOverlapWarning';
import { DepositTooHighWarning, RentAboveAverageWarning, OperatingCostsRatioWarning } from '@/components/shared/AdvancedPlausibilityChecks';

export default function ContractForm({ 
    open, 
    onOpenChange, 
    onSubmit, 
    initialData, 
    isLoading,
    units = [],
    tenants = []
}) {
    const [partialRentDialogOpen, setPartialRentDialogOpen] = React.useState(false);
    const [pendingContract, setPendingContract] = React.useState(null);
    const [suggestedPartialRent, setSuggestedPartialRent] = React.useState(0);
    const [newTenantMode, setNewTenantMode] = React.useState(false);
    const [newSecondTenantMode, setNewSecondTenantMode] = React.useState(false);
    const [bookingPreviewOpen, setBookingPreviewOpen] = React.useState(false);
    const [savedContractId, setSavedContractId] = React.useState(null);
    const [postContractDialogOpen, setPostContractDialogOpen] = React.useState(false);
    const [savedContractData, setSavedContractData] = React.useState(null);
    
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

    const { data: existingContracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract?.list?.() || [],
    });

    const isUnitOccupied = React.useMemo(() => {
        return existingContracts.some(c => c.unit_id === watchUnitId && c.status === 'active');
    }, [watchUnitId, existingContracts]);
    const watchDepositInstallments = watch('deposit_installments');

    const selectedUnit = units.find(u => u.id === watchUnitId);
    const selectedBuilding = React.useMemo(() => {
        if (!selectedUnit?.gebaeude_id) return null;
        return { id: selectedUnit.gebaeude_id }; // Will be enriched by query
    }, [selectedUnit]);

    const { data: buildingData } = useQuery({
        queryKey: ['building', selectedBuilding?.id],
        queryFn: () => base44.entities.Building.filter({ id: selectedBuilding.id }).then(r => r[0]),
        enabled: !!selectedBuilding?.id
    });

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

    const handleFormSubmit = async (data) => {
        // Create new tenants if needed
        let primaryTenantId = data.tenant_id;
        let secondTenantId = data.second_tenant_id;

        if (newTenantMode) {
            const newTenant = await base44.entities.Tenant.create({
                first_name: data.new_tenant_first_name,
                last_name: data.new_tenant_last_name,
                email: data.new_tenant_email || null,
                phone: data.new_tenant_phone || null
            });
            primaryTenantId = newTenant.id;
        }

        if (newSecondTenantMode) {
            const newSecondTenant = await base44.entities.Tenant.create({
                first_name: data.new_second_tenant_first_name,
                last_name: data.new_second_tenant_last_name,
                email: data.new_second_tenant_email || null,
                phone: data.new_second_tenant_phone || null
            });
            secondTenantId = newSecondTenant.id;
        }

        // Status automatisch bestimmen
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(data.start_date);
        const endDate = data.is_unlimited ? null : (data.end_date ? new Date(data.end_date) : null);

        let autoStatus = 'active';
        if (startDate > today) {
            autoStatus = 'pending';
        } else if (endDate && endDate < today) {
            autoStatus = 'expired';
        } else if (data.termination_date) {
            autoStatus = 'terminated';
        }

        const contractData = {
            ...data,
            tenant_id: primaryTenantId,
            second_tenant_id: secondTenantId || null,
            base_rent: parseFloat(data.base_rent) || 0,
            utilities: parseFloat(data.utilities) || 0,
            heating: parseFloat(data.heating) || 0,
            total_rent: parseFloat(data.total_rent) || 0,
            deposit: data.deposit ? parseFloat(data.deposit) : null,
            deposit_installments: data.deposit_installments ? parseInt(data.deposit_installments) : 1,
            notice_period_months: data.notice_period_months ? parseInt(data.notice_period_months) : null,
            rent_due_day: data.rent_due_day ? parseInt(data.rent_due_day) : null,
            end_date: data.is_unlimited ? null : data.end_date,
            handover_date: data.handover_date || null,
            contract_date: data.contract_date || null,
            status: autoStatus
        };

        const submittedContract = await onSubmit(contractData);

        if (submittedContract) {
            setSavedContractId(submittedContract.id);
            setSavedContractData(submittedContract);
            setPostContractDialogOpen(true); // Always show post-contract dialog
            if (needsPartialRentDialog(contractData)) {
                const partialAmount = calculatePartialRent(contractData, new Date(contractData.start_date));
                setSuggestedPartialRent(partialAmount);
                setPendingContract({ ...submittedContract, partialRentAmount: partialAmount, needsPartialRentConfirmation: true });
                setPartialRentDialogOpen(true);
            } else {
                // Show post-contract dialog instead of toast
                setPostContractDialogOpen(true);
            }
        }
    };

    const handlePartialRentConfirm = async (partialAmount) => {
        if (pendingContract) {
            try {
                await generateFinancialItemsForContract(pendingContract, [], partialAmount);
                setPendingContract(null);
                // Show post-contract dialog
                setPostContractDialogOpen(true);
            } catch (error) {
                console.error('Error generating financial items with partial rent:', error);
                toast.error('Fehler beim Generieren der Buchungen');
            }
        }
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
                    <ContractOverlapWarning
                        unitId={watchUnitId}
                        startDate={watch('start_date')}
                        endDate={watchIsUnlimited ? null : watch('end_date')}
                        excludeId={initialData?.id}
                    />

                    <DepositTooHighWarning
                        deposit={parseFloat(watch('deposit'))}
                        monthlyRent={parseFloat(watchBaseRent)}
                    />

                    <RentAboveAverageWarning
                        rentPerSqm={selectedUnit?.sqm ? (parseFloat(watchBaseRent) || 0) / selectedUnit.sqm : 0}
                        area={selectedUnit?.sqm}
                        city={buildingData?.city}
                    />

                    <OperatingCostsRatioWarning
                        operatingCosts={parseFloat(watchUtilities) + parseFloat(watchHeating)}
                        area={selectedUnit?.sqm}
                    />

                    {isUnitOccupied && (
                      <div className="p-3 bg-red-50 border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-xs text-red-800">⚠️ Diese Einheit ist bereits vermietet. Ein neuer Vertrag überschreibt den bestehenden.</p>
                      </div>
                    )}
                    
                    <HighRentWarning 
                        rentPerSqm={selectedUnit?.sqm ? (parseFloat(watchBaseRent) || 0) / selectedUnit.sqm : 0}
                        show={selectedUnit?.sqm && parseFloat(watchBaseRent) > 0}
                    />

                    {isUnitOccupied && (
                      <div className="col-span-2 p-3 bg-red-50 border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-xs text-red-800">⚠️ Diese Einheit ist bereits vermietet. Ein neuer Vertrag überschreibt den bestehenden.</p>
                      </div>
                    )}

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
                            <Label htmlFor="tenant_id">Hauptmieter *</Label>
                            {!newTenantMode ? (
                                <div className="space-y-2">
                                    <Select 
                                        value={watchTenantId} 
                                        onValueChange={(value) => setValue('tenant_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Hauptmieter wählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tenants.map((tenant) => (
                                                <SelectItem key={tenant.id} value={tenant.id}>
                                                    {tenant.first_name} {tenant.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setNewTenantMode(true)}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Neuen Mieter anlegen
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Neuer Mieter</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setNewTenantMode(false)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            {...register('new_tenant_first_name', { required: newTenantMode })}
                                            placeholder="Vorname *"
                                        />
                                        <Input
                                            {...register('new_tenant_last_name', { required: newTenantMode })}
                                            placeholder="Nachname *"
                                        />
                                    </div>
                                    <Input
                                        {...register('new_tenant_email')}
                                        placeholder="E-Mail (optional)"
                                        type="email"
                                    />
                                    <Input
                                        {...register('new_tenant_phone')}
                                        placeholder="Telefon (optional)"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="second_tenant_id">Zweiter Mieter (optional)</Label>
                        {!newSecondTenantMode ? (
                            <div className="space-y-2">
                                <Select 
                                    value={watch('second_tenant_id') || ''} 
                                    onValueChange={(value) => setValue('second_tenant_id', value || null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Zweiter Mieter wählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Kein zweiter Mieter</SelectItem>
                                        {tenants.filter(t => t.id !== watchTenantId).map((tenant) => (
                                            <SelectItem key={tenant.id} value={tenant.id}>
                                                {tenant.first_name} {tenant.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setNewSecondTenantMode(true)}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Neuen zweiten Mieter anlegen
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2 p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Neuer zweiter Mieter</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setNewSecondTenantMode(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        {...register('new_second_tenant_first_name', { required: newSecondTenantMode })}
                                        placeholder="Vorname *"
                                    />
                                    <Input
                                        {...register('new_second_tenant_last_name', { required: newSecondTenantMode })}
                                        placeholder="Nachname *"
                                    />
                                </div>
                                <Input
                                    {...register('new_second_tenant_email')}
                                    placeholder="E-Mail (optional)"
                                    type="email"
                                />
                                <Input
                                    {...register('new_second_tenant_phone')}
                                    placeholder="Telefon (optional)"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="contract_date">Datum Mietvertrag</Label>
                            <Input 
                                id="contract_date"
                                type="date"
                                {...register('contract_date')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="rent_due_day">Fälligkeit (Tag im Monat)</Label>
                            <Input 
                                id="rent_due_day"
                                type="number"
                                min="1"
                                max="31"
                                {...register('rent_due_day')}
                                placeholder="3"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="start_date">Mietbeginn *</Label>
                              <HelpTooltip text="Das Datum, ab dem der Mieter die Wohnung beziehen darf und Miete fällig wird." />
                            </div>
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
                            onCheckedChange={(checked) => {
                                setValue('is_unlimited', checked);
                                if (checked) {
                                    setValue('end_date', '');
                                }
                            }}
                        />
                    </div>

                    {!watchIsUnlimited && (
                        <div>
                            <Label htmlFor="end_date">Mietende *</Label>
                            <Input 
                                id="end_date"
                                type="date"
                                {...register('end_date', { required: !watchIsUnlimited })}
                            />
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Mietkonditionen</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                              <Label htmlFor="base_rent">Kaltmiete (€) *</Label>
                              <HelpTooltip text="Die monatliche Nettomiete (Kaltmiete) ohne Nebenkosten und Heizung." />
                            </div>
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

                    {/* Market Analysis */}
                    {watchUnitId && watchBaseRent && buildingData && selectedUnit && (
                        <RentMarketAnalyzer 
                            building={buildingData}
                            unit={selectedUnit}
                            currentRent={parseFloat(watchBaseRent) || 0}
                        />
                    )}

                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Kaution & Kündigungsfrist</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                              <Label htmlFor="deposit">Kaution (€)</Label>
                              <HelpTooltip text="Die Kaution wird vom Mieter hinterlegt als Sicherheit für Schäden. Maximal 3 Monatsmieten erlaubt." />
                            </div>
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
                                <div className="flex items-center gap-2">
                              <Label htmlFor="notice_period_months">Kündigungsfrist (Monate)</Label>
                              <HelpTooltip text="Die gesetzliche Kündigungsfrist beträgt 3 Monate zum 15. oder Ende eines Kalendermonats (§573 BGB)." />
                            </div>
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

            <PartialRentDialog
                open={partialRentDialogOpen}
                onOpenChange={setPartialRentDialogOpen}
                contract={pendingContract}
                partialAmount={suggestedPartialRent}
                onConfirm={handlePartialRentConfirm}
            />

            <BookingPreviewDialog
                open={bookingPreviewOpen}
                onOpenChange={setBookingPreviewOpen}
                sourceType="Mietvertrag"
                sourceId={savedContractId}
                onSuccess={() => {
                    setBookingPreviewOpen(false);
                    onOpenChange(false);
                }}
            />

            <PostContractDialog
                open={postContractDialogOpen}
                onOpenChange={setPostContractDialogOpen}
                contract={savedContractData}
                onGenerateBookings={async () => {
                    if (savedContractData) {
                        try {
                            await generateFinancialItemsForContract(savedContractData, []);
                            toast.success('Buchungen erfolgreich generiert');
                            setPostContractDialogOpen(false);
                        } catch (error) {
                            toast.error('Fehler beim Generieren der Buchungen');
                        }
                    }
                }}
            />
        </Dialog>
    );
}