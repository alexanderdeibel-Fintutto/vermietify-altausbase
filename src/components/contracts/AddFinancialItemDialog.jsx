import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Building2, User, FileText } from 'lucide-react';

export default function AddFinancialItemDialog({ open, onOpenChange, contracts, units, buildings, tenants }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        type: 'receivable',
        expected_amount: '',
        due_date: '',
        description: '',
        related_to_contract_id: '',
        related_to_unit_id: '',
        related_to_building_id: '',
        cost_type_id: '',
        notes: '',
        status: 'pending'
    });

    const { data: costTypes = [] } = useQuery({
        queryKey: ['cost-types'],
        queryFn: () => base44.entities.CostType.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.FinancialItem.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            toast.success('Mietforderung erstellt');
            onOpenChange(false);
            resetForm();
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen: ' + error.message);
        }
    });

    const resetForm = () => {
        setFormData({
            type: 'receivable',
            expected_amount: '',
            due_date: '',
            description: '',
            related_to_contract_id: '',
            related_to_unit_id: '',
            related_to_building_id: '',
            cost_type_id: '',
            notes: '',
            status: 'pending'
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.expected_amount || !formData.due_date || !formData.description || !formData.cost_type_id) {
            toast.error('Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        if (!formData.related_to_unit_id && !formData.related_to_building_id) {
            toast.error('Bitte mindestens ein Gebäude oder eine Wohneinheit auswählen');
            return;
        }

        const costType = costTypes.find(ct => ct.id === formData.cost_type_id);

        createMutation.mutate({
            type: formData.type,
            expected_amount: parseFloat(formData.expected_amount),
            amount: 0,
            due_date: formData.due_date,
            description: formData.description,
            related_to_contract_id: formData.related_to_contract_id || null,
            related_to_unit_id: formData.related_to_unit_id || null,
            cost_type_id: formData.cost_type_id,
            category: costType?.sub_category || 'other',
            status: formData.status,
            notes: formData.notes,
            is_automatic_from_contract: false
        });
    };

    // Filter units based on selected building
    const filteredUnits = useMemo(() => {
        if (!formData.related_to_building_id) return units;
        return units.filter(u => u.building_id === formData.related_to_building_id);
    }, [formData.related_to_building_id, units]);

    // Filter cost types based on selected type
    const filteredCostTypes = useMemo(() => {
        if (formData.type === 'receivable') {
            return costTypes.filter(ct => ct.type === 'income');
        } else {
            return costTypes.filter(ct => ct.type === 'expense');
        }
    }, [formData.type, costTypes]);

    // Group cost types by main category
    const groupedCostTypes = useMemo(() => {
        return filteredCostTypes.reduce((acc, ct) => {
            if (!acc[ct.main_category]) {
                acc[ct.main_category] = [];
            }
            acc[ct.main_category].push(ct);
            return acc;
        }, {});
    }, [filteredCostTypes]);

    // Auto-select unit and building when contract is selected
    const handleContractChange = (contractId) => {
        const contract = contracts.find(c => c.id === contractId);
        if (contract) {
            const unit = units.find(u => u.id === contract.unit_id);
            const tenant = tenants.find(t => t.id === contract.tenant_id);
            
            setFormData({
                ...formData,
                related_to_contract_id: contractId,
                related_to_unit_id: contract.unit_id,
                related_to_building_id: unit?.building_id || '',
                related_to_tenant_id: contract.tenant_id
            });
        } else {
            setFormData({
                ...formData,
                related_to_contract_id: contractId,
                related_to_tenant_id: null
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        Mietforderung hinzufügen
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type */}
                    <div>
                        <Label>Art *</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="receivable">Forderung (Einnahme)</SelectItem>
                                <SelectItem value="payable">Verbindlichkeit (Ausgabe)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount and Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Betrag (€) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.expected_amount}
                                onChange={(e) => setFormData({...formData, expected_amount: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <Label>Fälligkeitsdatum *</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label>Beschreibung *</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="z.B. Betriebskostenabrechnung 2024"
                            required
                        />
                    </div>

                    {/* Cost Type */}
                    <div>
                        <Label>Kostenart *</Label>
                        <Select 
                            value={formData.cost_type_id} 
                            onValueChange={(value) => setFormData({...formData, cost_type_id: value})}
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

                    {/* Contract */}
                    <div>
                        <Label>Mietvertrag (optional)</Label>
                        <Select 
                            value={formData.related_to_contract_id} 
                            onValueChange={handleContractChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vertrag auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>Kein Vertrag</SelectItem>
                                {contracts.map(contract => {
                                    const tenant = tenants.find(t => t.id === contract.tenant_id);
                                    const unit = units.find(u => u.id === contract.unit_id);
                                    const building = unit ? buildings.find(b => b.id === unit.building_id) : null;
                                    
                                    return (
                                        <SelectItem key={contract.id} value={contract.id}>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span>
                                                    {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                    {building && unit && ` • ${building.name} ${unit.unit_number}`}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Building */}
                    <div>
                        <Label>Gebäude (optional)</Label>
                        <Select 
                            value={formData.related_to_building_id} 
                            onValueChange={(value) => setFormData({
                                ...formData, 
                                related_to_building_id: value,
                                related_to_unit_id: '' // Reset unit when building changes
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Gebäude auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>Kein Gebäude</SelectItem>
                                {buildings.map(building => (
                                    <SelectItem key={building.id} value={building.id}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            {building.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Unit */}
                    <div>
                        <Label>Wohneinheit (optional)</Label>
                        <Select 
                            value={formData.related_to_unit_id} 
                            onValueChange={(value) => setFormData({...formData, related_to_unit_id: value})}
                            disabled={!formData.related_to_building_id}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wohneinheit auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>Keine Wohneinheit</SelectItem>
                                {filteredUnits.map(unit => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                        {unit.unit_number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div>
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Ausstehend</SelectItem>
                                <SelectItem value="partial">Teilweise bezahlt</SelectItem>
                                <SelectItem value="paid">Bezahlt</SelectItem>
                                <SelectItem value="overdue">Überfällig</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label>Notizen</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows={3}
                            placeholder="Zusätzliche Informationen..."
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                resetForm();
                            }}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {createMutation.isPending ? 'Erstelle...' : 'Forderung erstellen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}