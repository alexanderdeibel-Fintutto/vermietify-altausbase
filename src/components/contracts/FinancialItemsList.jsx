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
import { RefreshCw, Search, User, Building2, Euro, AlertCircle, Edit, Check, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { regenerateAllFinancialItems } from './generateFinancialItems';
import FinancialItemAllocationDialog from './FinancialItemAllocationDialog';

export default function FinancialItemsList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTenants, setSelectedTenants] = useState([]);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [selectedBuildings, setSelectedBuildings] = useState([]);
    const [monthFrom, setMonthFrom] = useState('');
    const [monthTo, setMonthTo] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

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

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }

        // Tenant filter
        if (selectedTenants.length > 0) {
            filtered = filtered.filter(item => 
                selectedTenants.includes(item.related_to_tenant_id)
            );
        }

        // Unit filter
        if (selectedUnits.length > 0) {
            filtered = filtered.filter(item => 
                selectedUnits.includes(item.related_to_unit_id)
            );
        }

        // Building filter
        if (selectedBuildings.length > 0) {
            filtered = filtered.filter(item => {
                const unit = units.find(u => u.id === item.related_to_unit_id);
                return unit && selectedBuildings.includes(unit.building_id);
            });
        }

        // Month range filter
        if (monthFrom) {
            filtered = filtered.filter(item => 
                item.payment_month && item.payment_month >= monthFrom
            );
        }
        if (monthTo) {
            filtered = filtered.filter(item => 
                item.payment_month && item.payment_month <= monthTo
            );
        }

        // Search term
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
    }, [rentDemands, statusFilter, categoryFilter, selectedTenants, selectedUnits, selectedBuildings, monthFrom, monthTo, searchTerm, tenants, units]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalExpected = rentDemands.reduce((sum, item) => sum + (item.expected_amount || 0), 0);
        const totalPaid = rentDemands.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
        const totalOutstanding = rentDemands
            .filter(item => item.status !== 'paid')
            .reduce((sum, item) => sum + ((item.expected_amount || 0) - (item.actualAmount || 0)), 0);
        const overdueCount = rentDemands.filter(item => {
            if (item.status === 'paid' || item.status === 'settled' || !item.payment_month) return false;
            try {
                const itemDate = parseISO(item.payment_month + '-01');
                if (isNaN(itemDate.getTime())) return false;
                return itemDate < new Date();
            } catch {
                return false;
            }
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
            overdue: 'bg-red-100 text-red-700',
            settled: 'bg-blue-100 text-blue-700'
        };
        const labels = {
            paid: 'Bezahlt',
            partial: 'Teilweise',
            pending: 'Ausstehend',
            overdue: 'Überfällig',
            settled: 'Erledigt'
        };
        return <Badge className={variants[status] || variants.pending}>{labels[status] || status}</Badge>;
    };

    const markAsSettledMutation = useMutation({
        mutationFn: async (itemIds) => {
            for (const id of itemIds) {
                await base44.entities.FinancialItem.update(id, { status: 'settled' });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            setSelectedItems([]);
            toast.success('Forderungen als erledigt markiert');
        },
        onError: () => {
            toast.error('Fehler beim Markieren');
        }
    });

    const handleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(item => item.id));
        }
    };

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
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
                    <div className="flex flex-col gap-4">
                        {/* Main Filter Row */}
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
                                    <SelectItem value="settled">Erledigt</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Erweiterte Filter
                                {(selectedTenants.length + selectedUnits.length + selectedBuildings.length + (monthFrom ? 1 : 0) + (monthTo ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)) > 0 && (
                                    <Badge className="ml-2 bg-emerald-600 text-white">
                                        {selectedTenants.length + selectedUnits.length + selectedBuildings.length + (monthFrom ? 1 : 0) + (monthTo ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)}
                                    </Badge>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                Sync
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleRegenerateAll}
                                disabled={isRegenerating}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                                Alle aktualisieren
                            </Button>

                            {selectedItems.length > 0 && (
                                <Button
                                    onClick={() => markAsSettledMutation.mutate(selectedItems)}
                                    disabled={markAsSettledMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Als erledigt ({selectedItems.length})
                                </Button>
                            )}
                        </div>

                        {/* Extended Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                                {/* Category Filter */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block">Kategorie</label>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Alle Kategorien" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Alle Kategorien</SelectItem>
                                            <SelectItem value="rent">Miete</SelectItem>
                                            <SelectItem value="deposit">Kaution</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Tenant Filter */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block">Mieter</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                {selectedTenants.length > 0 
                                                    ? `${selectedTenants.length} ausgewählt`
                                                    : 'Alle Mieter'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0">
                                            <Command>
                                                <CommandInput placeholder="Mieter suchen..." />
                                                <CommandEmpty>Keine Mieter gefunden</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto">
                                                    {tenants.map(tenant => {
                                                        const isSelected = selectedTenants.includes(tenant.id);
                                                        return (
                                                            <CommandItem
                                                                key={tenant.id}
                                                                onSelect={() => {
                                                                    setSelectedTenants(isSelected
                                                                        ? selectedTenants.filter(id => id !== tenant.id)
                                                                        : [...selectedTenants, tenant.id]
                                                                    );
                                                                }}
                                                            >
                                                                <div className={`mr-2 h-4 w-4 border rounded ${isSelected ? 'bg-emerald-600' : ''}`} />
                                                                <span className="text-sm">
                                                                    {tenant.first_name} {tenant.last_name}
                                                                </span>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Building Filter */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block">Gebäude</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                {selectedBuildings.length > 0 
                                                    ? `${selectedBuildings.length} ausgewählt`
                                                    : 'Alle Gebäude'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0">
                                            <Command>
                                                <CommandInput placeholder="Gebäude suchen..." />
                                                <CommandEmpty>Keine Gebäude gefunden</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto">
                                                    {buildings.map(building => {
                                                        const isSelected = selectedBuildings.includes(building.id);
                                                        return (
                                                            <CommandItem
                                                                key={building.id}
                                                                onSelect={() => {
                                                                    setSelectedBuildings(isSelected
                                                                        ? selectedBuildings.filter(id => id !== building.id)
                                                                        : [...selectedBuildings, building.id]
                                                                    );
                                                                }}
                                                            >
                                                                <div className={`mr-2 h-4 w-4 border rounded ${isSelected ? 'bg-emerald-600' : ''}`} />
                                                                <span className="text-sm">
                                                                    {building.name}
                                                                </span>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Unit Filter */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block">Wohneinheit</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                {selectedUnits.length > 0 
                                                    ? `${selectedUnits.length} ausgewählt`
                                                    : 'Alle Einheiten'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0">
                                            <Command>
                                                <CommandInput placeholder="Einheit suchen..." />
                                                <CommandEmpty>Keine Einheiten gefunden</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto">
                                                    {units.map(unit => {
                                                        const building = buildings.find(b => b.id === unit.building_id);
                                                        const isSelected = selectedUnits.includes(unit.id);
                                                        return (
                                                            <CommandItem
                                                                key={unit.id}
                                                                onSelect={() => {
                                                                    setSelectedUnits(isSelected
                                                                        ? selectedUnits.filter(id => id !== unit.id)
                                                                        : [...selectedUnits, unit.id]
                                                                    );
                                                                }}
                                                            >
                                                                <div className={`mr-2 h-4 w-4 border rounded ${isSelected ? 'bg-emerald-600' : ''}`} />
                                                                <span className="text-sm">
                                                                    {building?.name} - {unit.unit_number}
                                                                </span>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Month Range */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block">Monat von</label>
                                    <Input
                                        type="month"
                                        value={monthFrom}
                                        onChange={(e) => setMonthFrom(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block">Monat bis</label>
                                    <Input
                                        type="month"
                                        value={monthTo}
                                        onChange={(e) => setMonthTo(e.target.value)}
                                    />
                                </div>

                                {/* Reset Button */}
                                <div className="flex items-end md:col-span-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedTenants([]);
                                            setSelectedUnits([]);
                                            setSelectedBuildings([]);
                                            setMonthFrom('');
                                            setMonthTo('');
                                            setCategoryFilter('all');
                                        }}
                                        className="w-full"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Filter zurücksetzen
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Active Filters Display */}
                        {(selectedTenants.length > 0 || selectedUnits.length > 0 || selectedBuildings.length > 0 || monthFrom || monthTo || categoryFilter !== 'all') && (
                            <div className="flex flex-wrap gap-2 pt-3 border-t">
                                {categoryFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1">
                                        {categoryFilter === 'rent' ? 'Miete' : 'Kaution'}
                                        <X 
                                            className="w-3 h-3 cursor-pointer" 
                                            onClick={() => setCategoryFilter('all')}
                                        />
                                    </Badge>
                                )}
                                {selectedTenants.map(tenantId => {
                                    const tenant = tenants.find(t => t.id === tenantId);
                                    return tenant ? (
                                        <Badge key={tenantId} variant="secondary" className="gap-1">
                                            {tenant.first_name} {tenant.last_name}
                                            <X 
                                                className="w-3 h-3 cursor-pointer" 
                                                onClick={() => setSelectedTenants(selectedTenants.filter(id => id !== tenantId))}
                                            />
                                        </Badge>
                                    ) : null;
                                })}
                                {selectedBuildings.map(buildingId => {
                                    const building = buildings.find(b => b.id === buildingId);
                                    return building ? (
                                        <Badge key={buildingId} variant="secondary" className="gap-1">
                                            🏢 {building.name}
                                            <X 
                                                className="w-3 h-3 cursor-pointer" 
                                                onClick={() => setSelectedBuildings(selectedBuildings.filter(id => id !== buildingId))}
                                            />
                                        </Badge>
                                    ) : null;
                                })}
                                {selectedUnits.map(unitId => {
                                    const unit = units.find(u => u.id === unitId);
                                    const building = unit ? buildings.find(b => b.id === unit.building_id) : null;
                                    return unit ? (
                                        <Badge key={unitId} variant="secondary" className="gap-1">
                                            {building?.name} - {unit.unit_number}
                                            <X 
                                                className="w-3 h-3 cursor-pointer" 
                                                onClick={() => setSelectedUnits(selectedUnits.filter(id => id !== unitId))}
                                            />
                                        </Badge>
                                    ) : null;
                                })}
                                {(monthFrom || monthTo) && (
                                    <Badge variant="secondary" className="gap-1">
                                        📅 {monthFrom || '...'} bis {monthTo || '...'}
                                        <X 
                                            className="w-3 h-3 cursor-pointer" 
                                            onClick={() => { setMonthFrom(''); setMonthTo(''); }}
                                        />
                                    </Badge>
                                )}
                            </div>
                        )}
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
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-slate-300"
                                            />
                                        </TableHead>
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
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => handleSelectItem(item.id)}
                                                        className="w-4 h-4 rounded border-slate-300"
                                                    />
                                                </TableCell>
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