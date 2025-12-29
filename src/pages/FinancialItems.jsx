import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CreditCard, Filter, Search, Plus, RefreshCw, Check, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { regenerateAllFinancialItems } from '@/components/contracts/generateFinancialItems';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function FinancialItems() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showNewItemDialog, setShowNewItemDialog] = useState(false);
    const queryClient = useQueryClient();

    const { data: financialItems = [], isLoading } = useQuery({
        queryKey: ['financial-items'],
        queryFn: () => base44.entities.FinancialItem.list('-due_date')
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

    const { data: itemLinks = [] } = useQuery({
        queryKey: ['financial-item-transaction-links'],
        queryFn: () => base44.entities.FinancialItemTransactionLink.list()
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['bank-transactions'],
        queryFn: () => base44.entities.BankTransaction.list()
    });

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    // Calculate actual paid amount from links
    const getItemWithLinks = (item) => {
        const links = itemLinks.filter(link => link.financial_item_id === item.id);
        const paidAmount = links.reduce((sum, link) => sum + (link.linked_amount || 0), 0);
        
        // Calculate actual status based on paid amount
        let actualStatus = item.status;
        if (paidAmount >= item.expected_amount) {
            actualStatus = 'paid';
        } else if (paidAmount > 0) {
            actualStatus = 'partial';
        } else {
            actualStatus = 'pending';
        }

        return {
            ...item,
            amount: paidAmount,
            status: actualStatus,
            linkedTransactions: links.map(link => {
                const tx = transactions.find(t => t.id === link.transaction_id);
                return { link, transaction: tx };
            })
        };
    };

    const statusConfig = {
        paid: { label: 'Bezahlt', color: 'bg-emerald-100 text-emerald-700' },
        partial: { label: 'Teilzahlung', color: 'bg-amber-100 text-amber-700' },
        pending: { label: 'Ausstehend', color: 'bg-blue-100 text-blue-700' },
        overdue: { label: 'Überfällig', color: 'bg-red-100 text-red-700' }
    };

    const typeLabels = {
        receivable: 'Forderung',
        payable: 'Verbindlichkeit'
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Enrich items with link data
    const enrichedItems = financialItems.map(item => getItemWithLinks(item));

    const filteredItems = enrichedItems.filter(item => {
        // Filter by due date (only show items up to today for automatic ones)
        if (item.is_automatic_from_contract && item.due_date) {
            const dueDate = parseISO(item.due_date);
            if (dueDate > today) return false;
        }
        
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        
        if (!matchesStatus || !matchesType) return false;
        if (!searchTerm) return true;

        const tenant = getTenant(item.related_to_tenant_id);
        const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}`.toLowerCase() : '';
        const description = (item.description || '').toLowerCase();
        const reference = (item.reference || '').toLowerCase();
        
        return tenantName.includes(searchTerm.toLowerCase()) || 
               description.includes(searchTerm.toLowerCase()) ||
               reference.includes(searchTerm.toLowerCase());
    });

    const handleRegenerateItems = async () => {
        setIsRegenerating(true);
        try {
            const count = await regenerateAllFinancialItems();
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            toast.success(`${count} Mietforderungen wurden erfolgreich aktualisiert`);
        } catch (error) {
            toast.error('Fehler beim Aktualisieren der Forderungen');
        } finally {
            setIsRegenerating(false);
        }
    };

    // Calculate stats
    const receivables = enrichedItems.filter(i => i.type === 'receivable');
    const payables = enrichedItems.filter(i => i.type === 'payable');
    
    const totalReceived = receivables.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPending = receivables.filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + ((i.expected_amount || 0) - (i.amount || 0)), 0);
    const totalPayables = payables.reduce((sum, i) => sum + (i.expected_amount || 0) - (i.amount || 0), 0);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Forderungen & Verbindlichkeiten</h1>
                    <p className="text-slate-500 mt-1">{financialItems.length} Einträge erfasst</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setShowNewItemDialog(true)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Neue Forderung/Verbindlichkeit
                    </Button>
                    <Button 
                        onClick={async () => {
                            try {
                                const result = await base44.functions.invoke('repairBulkAllocations');
                                if (result.data.success) {
                                    toast.success(`${result.data.repaired} Transaktionen repariert`);
                                    queryClient.invalidateQueries({ queryKey: ['financial-items'] });
                                    queryClient.invalidateQueries({ queryKey: ['financial-item-transaction-links'] });
                                }
                            } catch (error) {
                                toast.error('Fehler beim Überprüfen');
                            }
                        }}
                        variant="outline"
                        className="gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Zuordnungen prüfen
                    </Button>
                    <Button 
                        onClick={handleRegenerateItems}
                        disabled={isRegenerating}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isRegenerating ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Wird aktualisiert...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Mietforderungen aktualisieren
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Eingegangene Zahlungen</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                        €{totalReceived.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        {receivables.filter(i => i.status === 'paid').length} Forderungen
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Ausstehende Forderungen</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">
                        €{totalPending.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        {receivables.filter(i => i.status === 'pending' || i.status === 'overdue').length} Forderungen
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Offene Verbindlichkeiten</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                        €{totalPayables.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        {payables.filter(i => i.status !== 'paid').length} Verbindlichkeiten
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Typen</SelectItem>
                            <SelectItem value="receivable">Forderungen</SelectItem>
                            <SelectItem value="payable">Verbindlichkeiten</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Status</SelectItem>
                            <SelectItem value="paid">Bezahlt</SelectItem>
                            <SelectItem value="pending">Ausstehend</SelectItem>
                            <SelectItem value="overdue">Überfällig</SelectItem>
                            <SelectItem value="partial">Teilzahlung</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Items Table */}
            {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Keine Einträge gefunden
                    </h3>
                    <p className="text-slate-500">
                        Es wurden keine Forderungen oder Verbindlichkeiten mit den ausgewählten Filtern gefunden.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Typ</TableHead>
                                    <TableHead>Beschreibung</TableHead>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Mieter</TableHead>
                                    <TableHead>Wohnung</TableHead>
                                    <TableHead>Betrag</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => {
                                    const tenant = getTenant(item.related_to_tenant_id);
                                    const unit = getUnit(item.related_to_unit_id);
                                    const building = unit ? getBuilding(unit.building_id) : null;
                                    const status = statusConfig[item.status] || statusConfig.pending;

                                    return (
                                        <TableRow key={item.id} className="hover:bg-slate-50">
                                            <TableCell>
                                                <Badge variant={item.type === 'receivable' ? 'default' : 'destructive'}>
                                                    {typeLabels[item.type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.description || item.reference || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {item.due_date && format(parseISO(item.due_date), 'dd.MM.yyyy')}
                                                {item.payment_month && ` (${format(parseISO(item.payment_month + '-01'), 'MMM yyyy', { locale: de })})`}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {tenant ? `${tenant.first_name} ${tenant.last_name}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {building && unit ? `${building.name} - ${unit.unit_number}` : '-'}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                               <div className="flex flex-col">
                                                   <span>
                                                       €{item.amount?.toFixed(2)}
                                                       {item.expected_amount && item.expected_amount !== item.amount && (
                                                           <span className="text-xs text-slate-400 ml-1">
                                                               / €{item.expected_amount.toFixed(2)}
                                                           </span>
                                                       )}
                                                   </span>
                                                   {item.linkedTransactions && item.linkedTransactions.length > 0 && (
                                                       <span className="text-xs text-emerald-600 mt-0.5">
                                                           {item.linkedTransactions.length} Transaktion(en)
                                                       </span>
                                                   )}
                                               </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={status.color}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <NewFinancialItemDialog 
                open={showNewItemDialog}
                onOpenChange={setShowNewItemDialog}
                tenants={tenants}
                units={units}
                buildings={buildings}
                contracts={contracts}
            />
        </div>
    );
}

function NewFinancialItemDialog({ open, onOpenChange, tenants, units, buildings, contracts }) {
    const [formData, setFormData] = useState({
        type: 'receivable',
        expected_amount: '',
        due_date: '',
        description: '',
        reference: '',
        related_to_contract_id: '',
        related_to_unit_id: '',
        related_to_tenant_id: '',
        notes: ''
    });
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.FinancialItem.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            toast.success('Forderung/Verbindlichkeit erstellt');
            onOpenChange(false);
            setFormData({
                type: 'receivable',
                expected_amount: '',
                due_date: '',
                description: '',
                reference: '',
                related_to_contract_id: '',
                related_to_unit_id: '',
                related_to_tenant_id: '',
                notes: ''
            });
        }
    });

    const handleSubmit = () => {
        if (!formData.expected_amount || !formData.due_date) {
            toast.error('Bitte füllen Sie alle Pflichtfelder aus');
            return;
        }

        createMutation.mutate({
            ...formData,
            expected_amount: parseFloat(formData.expected_amount),
            amount: 0,
            status: 'pending',
            is_automatic_from_contract: false,
            currency: 'EUR'
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Neue Forderung/Verbindlichkeit</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Typ *</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="receivable">Forderung</SelectItem>
                                <SelectItem value="payable">Verbindlichkeit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Betrag (€) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.expected_amount}
                                onChange={(e) => setFormData({...formData, expected_amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Fälligkeitsdatum *</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Beschreibung</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="z.B. Sondermiete für Garage"
                        />
                    </div>

                    <div>
                        <Label>Referenz/Verwendungszweck</Label>
                        <Input
                            value={formData.reference}
                            onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        />
                    </div>

                    <div>
                        <Label>Vertrag (optional)</Label>
                        <Select value={formData.related_to_contract_id} onValueChange={(value) => setFormData({...formData, related_to_contract_id: value})}>
                            <SelectTrigger>
                                <SelectValue placeholder="Kein Vertrag" />
                            </SelectTrigger>
                            <SelectContent>
                                {contracts.map(contract => {
                                    const tenant = tenants.find(t => t.id === contract.tenant_id);
                                    return (
                                        <SelectItem key={contract.id} value={contract.id}>
                                            {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Notizen</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}