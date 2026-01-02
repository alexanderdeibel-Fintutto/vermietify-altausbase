import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Pencil, Filter, TrendingUp, TrendingDown, DollarSign, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { regenerateAllFinancialItems } from '@/components/contracts/generateFinancialItems';
import FinancialItemAllocationDialog from '@/components/contracts/FinancialItemAllocationDialog';

export default function Finanzen() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [buildingFilter, setBuildingFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);

    // Fetch all necessary data
    const { data: financialItems = [], isLoading: loadingFinancialItems } = useQuery({
        queryKey: ['financial-items'],
        queryFn: () => base44.entities.FinancialItem.list('-due_date')
    });

    const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list('-invoice_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: costTypes = [] } = useQuery({
        queryKey: ['cost-types'],
        queryFn: () => base44.entities.CostType.list()
    });

    const { data: itemLinks = [] } = useQuery({
        queryKey: ['financial-item-transaction-links'],
        queryFn: () => base44.entities.FinancialItemTransactionLink.list()
    });

    const isLoading = loadingFinancialItems || loadingInvoices;

    // Helper functions
    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);
    const getCostType = (costTypeId) => costTypes.find(ct => ct.id === costTypeId);

    // Transform data to unified format
    const unifiedItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const items = [];

        // Add FinancialItems
        financialItems.forEach(item => {
            // Skip future automatic items
            if (item.is_automatic_from_contract && item.due_date) {
                try {
                    const dueDate = parseISO(item.due_date);
                    if (dueDate > today) return;
                } catch {
                    // Invalid date, skip validation
                }
            }

            // Calculate actual paid amount from links
            const links = itemLinks.filter(link => link.financial_item_id === item.id);
            
            // Skip if this financial item is linked to an invoice (will be shown as invoice instead)
            const hasInvoiceLink = links.some(link => link.invoice_id);
            if (hasInvoiceLink) return;
            
            const paidAmount = links.reduce((sum, link) => sum + (link.linked_amount || 0), 0);
            
            // Calculate actual status
            let actualStatus = item.status;
            if (paidAmount >= item.expected_amount) {
                actualStatus = 'paid';
            } else if (paidAmount > 0) {
                actualStatus = 'partial';
            } else {
                actualStatus = 'pending';
            }

            const unit = getUnit(item.related_to_unit_id);
            const building = unit ? getBuilding(unit.building_id) : null;

            items.push({
                id: item.id,
                source: 'financial_item',
                type: item.type === 'receivable' ? 'income' : 'expense',
                date: item.due_date,
                description: item.description || item.reference || 'Mietforderung',
                expectedAmount: item.expected_amount || 0,
                paidAmount: paidAmount,
                status: actualStatus,
                tenant: getTenant(item.related_to_tenant_id),
                unit: unit,
                building: building,
                category: item.category,
                paymentMonth: item.payment_month,
                reference: item.reference,
                isAutomatic: item.is_automatic_from_contract,
                rawData: item
            });
        });

        // Add Invoices
        invoices.forEach(invoice => {
            // Calculate paid amount from links
            const links = itemLinks.filter(link => link.invoice_id === invoice.id);
            const paidAmount = links.reduce((sum, link) => sum + (link.linked_amount || 0), 0);

            const unit = getUnit(invoice.unit_id);
            const building = invoice.building_id 
                ? getBuilding(invoice.building_id) 
                : (unit ? getBuilding(unit.building_id) : null);
            const costType = getCostType(invoice.cost_type_id);

            items.push({
                id: invoice.id,
                source: 'invoice',
                type: invoice.type,
                date: invoice.invoice_date,
                description: invoice.description,
                expectedAmount: invoice.expected_amount || invoice.amount || 0,
                paidAmount: invoice.paid_amount || paidAmount,
                status: invoice.status,
                recipient: invoice.recipient,
                unit: unit,
                building: building,
                costType: costType,
                reference: invoice.reference,
                isAutomatic: false,
                rawData: invoice
            });
        });

        return items.sort((a, b) => {
            try {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                return dateB - dateA;
            } catch {
                return 0;
            }
        });
    }, [financialItems, invoices, itemLinks, units, buildings, tenants, costTypes]);

    // Filter items
    const filteredItems = useMemo(() => {
        return unifiedItems.filter(item => {
            // Status filter
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;

            // Type filter
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;

            // Building filter
            if (buildingFilter !== 'all' && item.building?.id !== buildingFilter) return false;

            // Search
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesDescription = item.description?.toLowerCase().includes(term);
                const matchesReference = item.reference?.toLowerCase().includes(term);
                const matchesTenant = item.tenant 
                    ? `${item.tenant.first_name} ${item.tenant.last_name}`.toLowerCase().includes(term)
                    : false;
                const matchesRecipient = item.recipient?.toLowerCase().includes(term);
                
                if (!matchesDescription && !matchesReference && !matchesTenant && !matchesRecipient) {
                    return false;
                }
            }

            return true;
        });
    }, [unifiedItems, statusFilter, typeFilter, buildingFilter, searchTerm]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalIncome = filteredItems
            .filter(i => i.type === 'income' || i.type === 'other_income')
            .reduce((sum, i) => sum + i.expectedAmount, 0);
        
        const totalExpenses = filteredItems
            .filter(i => i.type === 'expense')
            .reduce((sum, i) => sum + i.expectedAmount, 0);
        
        const totalPaid = filteredItems
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + i.paidAmount, 0);
        
        const totalPending = filteredItems
            .filter(i => i.status === 'pending' || i.status === 'overdue' || i.status === 'partial')
            .reduce((sum, i) => sum + (i.expectedAmount - i.paidAmount), 0);

        return { totalIncome, totalExpenses, totalPaid, totalPending };
    }, [filteredItems]);

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

    const handleMigrateInvoices = async () => {
        try {
            toast.info('Migriere Rechnungen...');
            const result = await base44.functions.invoke('migrateInvoicesToFinancialModel');
            
            if (result.data.success) {
                toast.success(`Migration erfolgreich: ${result.data.updated} Rechnungen aktualisiert`);
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
            } else {
                toast.error('Migration fehlgeschlagen: ' + (result.data.error || 'Unbekannter Fehler'));
            }
        } catch (error) {
            console.error('Migration error:', error);
            toast.error('Fehler: ' + (error.message || 'Migration fehlgeschlagen'));
        }
    };

    const statusConfig = {
        paid: { label: 'Bezahlt', color: 'bg-emerald-100 text-emerald-700' },
        partial: { label: 'Teilzahlung', color: 'bg-amber-100 text-amber-700' },
        pending: { label: 'Ausstehend', color: 'bg-blue-100 text-blue-700' },
        overdue: { label: 'Überfällig', color: 'bg-red-100 text-red-700' }
    };

    const handleOpenAllocation = (item) => {
        setSelectedItem(item);
        setAllocationDialogOpen(true);
    };

    if (isLoading) {
        return <div className="p-8">Lädt...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
                        Finanzen
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {filteredItems.length} {filteredItems.length === 1 ? 'Eintrag' : 'Einträge'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleMigrateInvoices}
                        variant="outline"
                        size="sm"
                    >
                        Rechnungen migrieren
                    </Button>
                    <Button 
                        onClick={handleRegenerateItems}
                        disabled={isRegenerating}
                        variant="outline"
                        className="gap-2"
                    >
                        {isRegenerating ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Aktualisiere...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Mietforderungen aktualisieren
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Erwartete Einnahmen</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    €{stats.totalIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Ausgaben</p>
                                <p className="text-2xl font-bold text-red-600">
                                    €{stats.totalExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Bezahlt</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    €{stats.totalPaid.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Ausstehend</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    €{stats.totalPending.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <FileText className="w-8 h-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Suche nach Beschreibung, Referenz, Mieter, Empfänger..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full lg:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Typen</SelectItem>
                                    <SelectItem value="income">Einnahmen</SelectItem>
                                    <SelectItem value="other_income">Sonst. Einnahmen</SelectItem>
                                    <SelectItem value="expense">Ausgaben</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full lg:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Status</SelectItem>
                                    <SelectItem value="pending">Ausstehend</SelectItem>
                                    <SelectItem value="partial">Teilzahlung</SelectItem>
                                    <SelectItem value="paid">Bezahlt</SelectItem>
                                    <SelectItem value="overdue">Überfällig</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                        </div>

                        {showFilters && (
                            <div className="pt-4 border-t">
                                <div>
                                    <label className="text-xs font-medium mb-2 block">Gebäude</label>
                                    <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Alle Gebäude" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Alle Gebäude</SelectItem>
                                            {buildings.map(building => (
                                                <SelectItem key={building.id} value={building.id}>
                                                    {building.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Keine Einträge gefunden
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quelle</TableHead>
                                        <TableHead>Typ</TableHead>
                                        <TableHead>Datum</TableHead>
                                        <TableHead>Beschreibung</TableHead>
                                        <TableHead>Mieter/Empfänger</TableHead>
                                        <TableHead>Objekt</TableHead>
                                        <TableHead className="text-right">Betrag</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aktionen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map((item) => {
                                        const status = statusConfig[item.status] || statusConfig.pending;
                                        const typeLabel = item.type === 'income' ? 'Einnahme' 
                                            : item.type === 'other_income' ? 'Sonst. Einnahme' 
                                            : 'Ausgabe';
                                        const typeColor = item.type === 'expense' 
                                            ? 'border-red-300 text-red-700' 
                                            : 'border-emerald-300 text-emerald-700';

                                        return (
                                            <TableRow key={`${item.source}-${item.id}`}>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.source === 'financial_item' ? 'Forderung' : 'Rechnung'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={typeColor}>
                                                        {typeLabel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.date ? (() => {
                                                        try {
                                                            return format(parseISO(item.date), 'dd.MM.yyyy', { locale: de });
                                                        } catch {
                                                            return item.date;
                                                        }
                                                    })() : '-'}
                                                    {item.paymentMonth && (
                                                        <div className="text-xs text-slate-500">
                                                            {(() => {
                                                                try {
                                                                    return format(parseISO(item.paymentMonth + '-01'), 'MMM yyyy', { locale: de });
                                                                } catch {
                                                                    return item.paymentMonth;
                                                                }
                                                            })()}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.description}</p>
                                                        {item.reference && (
                                                            <p className="text-xs text-slate-500">{item.reference}</p>
                                                        )}
                                                        {item.costType && (
                                                            <p className="text-xs text-slate-500">
                                                                {item.costType.main_category} - {item.costType.sub_category}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {item.tenant ? `${item.tenant.first_name} ${item.tenant.last_name}` 
                                                        : item.recipient || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {item.building && item.unit ? (
                                                        <div>
                                                            <p className="font-medium">{item.building.name}</p>
                                                            <p className="text-xs text-slate-500">{item.unit.unit_number}</p>
                                                        </div>
                                                    ) : item.building ? (
                                                        item.building.name
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div>
                                                        <p className="font-semibold">
                                                            €{item.paidAmount.toFixed(2)}
                                                        </p>
                                                        {item.expectedAmount !== item.paidAmount && (
                                                            <p className="text-xs text-slate-400">
                                                                von €{item.expectedAmount.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={status.color}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenAllocation(item)}>
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                Zuordnungen bearbeiten
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Allocation Dialog */}
            {selectedItem && (
                <FinancialItemAllocationDialog
                    open={allocationDialogOpen}
                    onOpenChange={setAllocationDialogOpen}
                    financialItem={selectedItem.source === 'financial_item' ? selectedItem.rawData : null}
                    invoice={selectedItem.source === 'invoice' ? selectedItem.rawData : null}
                    buildings={buildings}
                    units={units}
                    contracts={contracts}
                    tenants={tenants}
                />
            )}
        </div>
    );
}