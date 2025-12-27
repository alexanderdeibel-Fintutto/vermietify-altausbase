import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CreatePaymentFromTransaction({ 
    open, 
    onOpenChange, 
    transaction,
    onPaymentCreated 
}) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        contract_id: '',
        payment_month: transaction ? format(new Date(transaction.transaction_date), 'yyyy-MM') : '',
        payment_date: transaction?.transaction_date || '',
        expected_amount: transaction ? Math.abs(transaction.amount) : 0,
        amount: transaction ? Math.abs(transaction.amount) : 0,
        payment_type: 'rent',
        status: 'paid',
        reference: transaction?.reference || ''
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const selectedContract = contracts.find(c => c.id === data.contract_id);
            if (!selectedContract) {
                throw new Error('Vertrag nicht gefunden');
            }

            return await base44.entities.Payment.create({
                ...data,
                tenant_id: selectedContract.tenant_id,
                unit_id: selectedContract.unit_id,
                amount: parseFloat(data.amount),
                expected_amount: parseFloat(data.expected_amount)
            });
        },
        onSuccess: (payment) => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Zahlung erstellt');
            onPaymentCreated(payment);
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen: ' + error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.contract_id) {
            toast.error('Bitte wählen Sie einen Vertrag aus');
            return;
        }
        createMutation.mutate(formData);
    };

    const activeContracts = contracts.filter(c => c.status === 'active');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Neue Zahlung erstellen</DialogTitle>
                    <DialogDescription>
                        Erstellen Sie eine neue Zahlung basierend auf dieser Transaktion
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="contract_id">Mietvertrag *</Label>
                        <Select 
                            value={formData.contract_id} 
                            onValueChange={(value) => setFormData({ ...formData, contract_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vertrag auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {activeContracts.map(contract => {
                                    const tenant = tenants.find(t => t.id === contract.tenant_id);
                                    const unit = units.find(u => u.id === contract.unit_id);
                                    const building = unit ? buildings.find(b => b.id === unit.building_id) : null;
                                    
                                    return (
                                        <SelectItem key={contract.id} value={contract.id}>
                                            {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                            {building && unit && ` • ${building.name} ${unit.unit_number}`}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="payment_month">Monat *</Label>
                            <Input 
                                id="payment_month"
                                type="month"
                                value={formData.payment_month}
                                onChange={(e) => setFormData({ ...formData, payment_month: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="payment_date">Zahlungsdatum *</Label>
                            <Input 
                                id="payment_date"
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="expected_amount">Erwarteter Betrag (€) *</Label>
                            <Input 
                                id="expected_amount"
                                type="number"
                                step="0.01"
                                value={formData.expected_amount}
                                onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="amount">Erhaltener Betrag (€) *</Label>
                            <Input 
                                id="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="payment_type">Zahlungsart</Label>
                        <Select 
                            value={formData.payment_type}
                            onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rent">Miete</SelectItem>
                                <SelectItem value="deposit">Kaution</SelectItem>
                                <SelectItem value="utilities_settlement">Nebenkostenabrechnung</SelectItem>
                                <SelectItem value="other">Sonstiges</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="reference">Referenz</Label>
                        <Input 
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="z.B. Verwendungszweck"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Plus className="w-4 h-4 mr-2" />
                            Erstellen & Abgleichen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}