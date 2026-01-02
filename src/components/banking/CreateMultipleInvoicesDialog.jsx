import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { FileText, Loader2, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function CreateMultipleInvoicesDialog({
    open,
    onOpenChange,
    transactions,
    costTypes,
    buildings = [],
    units = [],
    onSuccess
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showNewRecipient, setShowNewRecipient] = useState(false);
    const [formData, setFormData] = useState({
        cost_type_id: '',
        recipient: '',
        description: '',
        building_id: '',
        unit_id: '',
        notes: ''
    });

    const { data: recipients = [] } = useQuery({
        queryKey: ['recipients'],
        queryFn: () => base44.entities.Recipient.list(),
        staleTime: 60000
    });

    const selectedCostType = costTypes.find(ct => ct.id === formData.cost_type_id);
    const groupedCostTypes = costTypes.reduce((acc, ct) => {
        if (!acc[ct.main_category]) {
            acc[ct.main_category] = [];
        }
        acc[ct.main_category].push(ct);
        return acc;
    }, {});

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.cost_type_id || !formData.recipient || !formData.description) {
            toast.error('Bitte füllen Sie alle Pflichtfelder aus');
            return;
        }

        setIsProcessing(true);

        try {
            const response = await base44.functions.invoke('createMultipleInvoicesAndAllocateTransactions', {
                transactionIds: transactions.map(tx => tx.id),
                invoiceData: {
                    ...formData,
                    category_name: selectedCostType?.sub_category || 'unknown',
                    operating_cost_relevant: selectedCostType?.distributable || false
                }
            });

            const successCount = response.data.successCount || response.data.results.filter(r => r.success).length;
            const errorCount = response.data.errorCount || response.data.results.filter(r => !r.success).length;
            
            if (successCount > 0) {
                toast.success(`${successCount} Rechnungen erfolgreich erstellt`);
            }
            if (errorCount > 0) {
                const errors = response.data.results.filter(r => !r.success);
                console.error('Failed transactions:', errors);
                toast.error(`${errorCount} Fehler beim Erstellen. Siehe Konsole für Details.`, { duration: 10000 });
            }
            
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error('Fehler: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <DialogTitle>Mehrere Rechnungen erstellen & zuordnen</DialogTitle>
                    </div>
                    <DialogDescription>
                        Erstellen Sie für jede ausgewählte Transaktion eine Rechnung mit gemeinsamen Stammdaten.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Selected Transactions Summary */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">Ausgewählte Transaktionen: {transactions.length}</p>
                        <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center gap-2">
                                    <span className="truncate">{tx.description}</span>
                                    <span className="font-semibold whitespace-nowrap">€{Math.abs(tx.amount).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cost Type */}
                    <div>
                        <Label>Kostenart *</Label>
                        <Select
                            value={formData.cost_type_id}
                            onValueChange={(value) => setFormData({ ...formData, cost_type_id: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kostenart auswählen..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {Object.entries(groupedCostTypes).map(([mainCategory, types]) => [
                                    <div key={mainCategory} className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                                        {mainCategory}
                                    </div>,
                                    ...types.map(ct => (
                                        <SelectItem key={ct.id} value={ct.id}>
                                            <span className="ml-2">{ct.sub_category}</span>
                                        </SelectItem>
                                    ))
                                ])}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Recipient */}
                    <div>
                        <Label>Empfänger/Aussteller *</Label>
                        {showNewRecipient ? (
                            <div className="space-y-2">
                                <Input
                                    value={formData.recipient}
                                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                    placeholder="Name des Empfängers eingeben..."
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowNewRecipient(false);
                                        setFormData({ ...formData, recipient: '' });
                                    }}
                                >
                                    Aus Liste wählen
                                </Button>
                            </div>
                        ) : (
                            <Select
                                value={formData.recipient}
                                onValueChange={(value) => {
                                    if (value === '__new__') {
                                        setShowNewRecipient(true);
                                        setFormData({ ...formData, recipient: '' });
                                    } else {
                                        setFormData({ ...formData, recipient: value });
                                    }
                                }}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Empfänger auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__new__" className="text-emerald-600 font-medium">
                                        <Plus className="w-4 h-4 inline mr-2" />
                                        Neuer Empfänger
                                    </SelectItem>
                                    {recipients.length > 0 && (
                                        <>
                                            <div className="border-t my-1" />
                                            {recipients.map(recipient => (
                                                <SelectItem key={recipient.id} value={recipient.name}>
                                                    {recipient.name}
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <Label>Beschreibung *</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Building */}
                        <div>
                            <Label>Gebäude (optional)</Label>
                            <Select
                                value={formData.building_id}
                                onValueChange={(value) => setFormData({ ...formData, building_id: value, unit_id: '' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Gebäude auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>Kein Gebäude</SelectItem>
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
                            <Label>Wohneinheit (optional)</Label>
                            <Select
                                value={formData.unit_id}
                                onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                                disabled={!formData.building_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Einheit auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>Keine Einheit</SelectItem>
                                    {units
                                        .filter(u => u.building_id === formData.building_id)
                                        .map(unit => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.unit_number}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label>Notizen</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isProcessing}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verarbeite...
                                </>
                            ) : (
                                `${transactions.length} Rechnungen erstellen`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}