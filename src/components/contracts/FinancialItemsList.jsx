import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Search, User, Building2, Euro, AlertCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { regenerateAllFinancialItems } from './generateFinancialItems';
import FinancialItemAllocationDialog from './FinancialItemAllocationDialog';

export default function FinancialItemsList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);

    const { data: financialItems = [], isLoading: loadingItems } = useQuery({
        queryKey: ['financial-items'],
        queryFn: () => base44.entities.FinancialItem.list()
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

    const { data: financialItemLinks = [] } = useQuery({
        queryKey: ['financial-item-transaction-links'],
        queryFn: () => base44.entities.FinancialItemTransactionLink.list()
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['bank-transactions'],
        queryFn: () => base44.entities.BankTransaction.list()
    });

    // Process financial items with transaction data
    const processedFinancialItems = useMemo(() => {
        if (!financialItems.length || !financialItemLinks.length || !transactions.length) {
            return financialItems.map(item => ({
                ...item,
                linkedTransactions: [],
                actualAmount: item.amount || 0
            }));
        }

        return financialItems.map(item => {
            const links = financialItemLinks.filter(link => link.financial_item_id === item.id);
            const linkedTransactions = links.map(link => {
                const transaction = transactions.find(t => t.id === link.transaction_id);
                return {
                    ...link,
                    transaction
                };
            }).filter(link => link.transaction);

            const actualAmount = links.reduce((sum, link) => sum + (link.linked_amount || 0), 0);

            return {
                ...item,
                linkedTransactions,
                actualAmount
            };
        });
    }, [financialItems, financialItemLinks, transactions]);

    // Filter for rent demands only, up to and including current month
    const rentDemands = useMemo(() => {
        const now = new Date();
        const currentMonth = format(now, 'yyyy-MM');

        return processedFinancialItems.filter(item => {
            if (item.type !== 'receivable') return false;
            if (item.category !== 'rent' && item.category !== 'deposit') return false;
            if (!item.payment_month || typeof item.payment_month !== 'string') return false;
            
            // Only show items up to and including current month
            try {
                return item.payment_month <= currentMonth;
            } catch {
                return false;
            }
        });
    }, [processedFinancialItems]);

    // Apply filters
    const filteredItems = useMemo(() => {
        let filtered = rentDemands;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item => {
                const tenant = tenants.find(t => t.id === item.related_to_tenant_id);
                const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}`.toLowerCase() : '';
                const reference = (item.reference || '').toLowerCase();
                const description = (item.description || '').toLowerCase();
                
                return tenantName.includes(term) || reference.includes(term) || description.includes(term);
            });
        }

        return filtered.sort((a, b) => {
            if (!a.payment_month) return 1;
            if (!b.payment_month) return -1;
            return b.payment_month.localeCompare(a.payment_month);
        });
    }, [rentDemands, statusFilter, searchTerm, tenants]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalExpected = rentDemands.reduce((sum, item) => sum + (item.expected_amount || 0), 0);
        const totalPaid = rentDemands.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
        const totalOutstanding = rentDemands
            .filter(item => item.status !== 'paid')
            .reduce((sum, item) => sum + ((item.expected_amount || 0) - (item.actualAmount || 0)), 0);
        const overdueCount = rentDemands.filter(item => {
            if (item.status === 'paid' || !item.payment_month) return false;
            const itemDate = parseISO(item.payment_month + '-01');
            return itemDate < new Date();
        }).length;

        return {
            totalExpected,
            totalPaid,
            totalOutstanding,
            overdueCount
        };
    }, [rentDemands]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await base44.functions.invoke('syncFinancialItemsWithTransactions', {});
            await queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            await queryClient.invalidateQueries({ queryKey: ['financial-item-transaction-links'] });
            toast.success('Synchronisierung erfolgreich');
        } catch (error) {
            toast.error('Fehler bei der Synchronisierung');
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRegenerateAll = async () => {
        if (!confirm('Möchten Sie wirklich alle Forderungen neu generieren? Bereits bezahlte Forderungen werden nicht gelöscht.')) {
            return;
        }

        setIsRegenerating(true);
        try {
            const count = await regenerateAllFinancialItems();
            await queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            toast.success(`${count} Forderungen wurden generiert`);
        } catch (error) {
            toast.error('Fehler bei der Neugenerierung');
            console.error(error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    const getStatusBadge = (status) => {
        const variants = {
            paid: 'bg-emerald-100 text-emerald-700',
            partial: 'bg-amber-100 text-amber-700',
            pending: 'bg-slate-100 text-slate-700',
            overdue: 'bg-red-100 text-red-700'
        };
        const labels = {
            paid: 'Bezahlt',
            partial: 'Teilweise',
            pending: 'Ausstehend',
            overdue: 'Überfällig'
        };
        return <Badge className={variants[status] || variants.pending}>{labels[status] || status}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Gesamt Erwartet</CardTitle>
                        <Euro className="w-4 h-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats.totalExpected.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Bezahlt</CardTitle>
                        <Euro className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">€{stats.totalPaid.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Ausstehend</CardTitle>
                        <Euro className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">€{stats.totalOutstanding.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Überfällig</CardTitle>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Suche nach Mieter oder Referenz..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full lg:w-48">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="pending">Ausstehend</SelectItem>
                                <SelectItem value="partial">Teilweise</SelectItem>
                                <SelectItem value="paid">Bezahlt</SelectItem>
                                <SelectItem value="overdue">Überfällig</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={handleSync}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            Synchronisieren
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleRegenerateAll}
                            disabled={isRegenerating}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                            Alle aktualisieren
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Keine Mietforderungen gefunden
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Monat</TableHead>
                                        <TableHead>Mieter</TableHead>
                                        <TableHead>Objekt</TableHead>
                                        <TableHead>Typ</TableHead>
                                        <TableHead className="text-right">Erwartet</TableHead>
                                        <TableHead className="text-right">Bezahlt</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Transaktionen</TableHead>
                                        <TableHead className="text-right">Aktion</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map((item) => {
                                        const tenant = getTenant(item.related_to_tenant_id);
                                        const unit = getUnit(item.related_to_unit_id);
                                        const building = unit ? getBuilding(unit.building_id) : null;

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.payment_month ? (() => {
                                                        try {
                                                            return format(parseISO(item.payment_month + '-01'), 'MMM yyyy', { locale: de });
                                                        } catch {
                                                            return item.payment_month;
                                                        }
                                                    })() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        <span>{tenant ? `${tenant.first_name} ${tenant.last_name}` : '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <span>{building && unit ? `${building.name} - ${unit.unit_number}` : '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.category === 'rent' ? 'Miete' : item.category === 'deposit' ? 'Kaution' : item.category}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    €{(item.expected_amount || 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-emerald-600">
                                                    €{item.actualAmount.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(item.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {item.linkedTransactions && item.linkedTransactions.length > 0 ? (
                                                        <span className="text-sm text-slate-600">
                                                            {item.linkedTransactions.length} Transaktion(en)
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setAllocationDialogOpen(true);
                                                        }}
                                                        className="text-slate-600 hover:text-slate-800"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        Bearbeiten
                                                    </Button>
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

            {allocationDialogOpen && selectedItem && (
                <FinancialItemAllocationDialog
                    financialItem={selectedItem}
                    onClose={() => {
                        setAllocationDialogOpen(false);
                        setSelectedItem(null);
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['financial-items'] });
                    }}
                />
            )}
        </div>
    );
}