import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';

export default function CreateInvoiceFromTransactionDialog({ 
    open, 
    onOpenChange, 
    transaction, 
    costTypes,
    buildings = [],
    units = [],
    onSuccess 
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        cost_type_id: '',
        recipient: transaction?.sender_receiver || '',
        amount: Math.abs(transaction?.amount || 0),
        invoice_date: transaction?.transaction_date || '',
        description: transaction?.description || '',
        reference: transaction?.reference || transaction?.description || '',
        building_id: '',
        unit_id: '',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.cost_type_id) {
            toast.error('Bitte wählen Sie eine Kostenart aus');
            return;
        }

        setIsProcessing(true);

        try {
            const response = await base44.functions.invoke('createInvoiceAndAllocateTransaction', {
                transactionId: transaction.id,
                invoiceData: formData
            });

            if (response.data.success) {
                toast.success('Rechnung erstellt und Transaktion zugeordnet');
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(response.data.error || 'Fehler beim Erstellen');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error('Fehler beim Erstellen der Rechnung');
        } finally {
            setIsProcessing(false);
        }
    };

    // Group cost types by main category
    const groupedCostTypes = costTypes.reduce((acc, ct) => {
        if (!acc[ct.main_category]) {
            acc[ct.main_category] = [];
        }
        acc[ct.main_category].push(ct);
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <DialogTitle>Rechnung/Beleg erstellen & zuordnen</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Transaction Info */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">Transaktion:</p>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-slate-600">Betrag:</span> <span className="font-semibold">€{Math.abs(transaction?.amount || 0).toFixed(2)}</span></p>
                            <p><span className="text-slate-600">Datum:</span> {transaction?.transaction_date}</p>
                            <p><span className="text-slate-600">Von/An:</span> {transaction?.sender_receiver}</p>
                        </div>
                    </div>

                    {/* Cost Type Selection */}
                    <div>
                        <Label>Kostenart *</Label>
                        <Select 
                            value={formData.cost_type_id} 
                            onValueChange={(value) => setFormData({...formData, cost_type_id: value})}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kostenart auswählen..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {Object.entries(groupedCostTypes).map(([mainCategory, types]) => (
                                    <React.Fragment key={mainCategory}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                                            {mainCategory}
                                        </div>
                                        {types.map(ct => (
                                            <SelectItem key={ct.id} value={ct.id}>
                                                <span className="ml-2">{ct.sub_category}</span>
                                            </SelectItem>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount */}
                        <div>
                            <Label>Betrag (€) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                                required
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <Label>Rechnungsdatum *</Label>
                            <Input
                                type="date"
                                value={formData.invoice_date}
                                onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    {/* Recipient */}
                    <div>
                        <Label>Empfänger/Aussteller *</Label>
                        <Input
                            value={formData.recipient}
                            onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label>Beschreibung *</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            required
                        />
                    </div>

                    {/* Reference */}
                    <div>
                        <Label>Referenz/Rechnungsnummer</Label>
                        <Input
                            value={formData.reference}
                            onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Building */}
                        <div>
                            <Label>Gebäude (optional)</Label>
                            <Select 
                                value={formData.building_id} 
                                onValueChange={(value) => setFormData({...formData, building_id: value, unit_id: ''})}
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
                                onValueChange={(value) => setFormData({...formData, unit_id: value})}
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
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
                                    Erstelle...
                                </>
                            ) : (
                                'Erstellen & Zuordnen'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}