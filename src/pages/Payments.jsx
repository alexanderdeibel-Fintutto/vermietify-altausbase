import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CreditCard, Filter, Search, Plus, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { regenerateAllPayments } from '@/components/contracts/generatePayments';
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
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

export default function Payments() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const queryClient = useQueryClient();

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const allPayments = await base44.entities.Payment.list('-payment_date');
            const contracts = await base44.entities.LeaseContract.list();
            const contractIds = new Set(contracts.map(c => c.id));
            
            // Zahlungen ohne existierenden Vertrag löschen
            const orphanedPayments = allPayments.filter(p => !contractIds.has(p.contract_id));
            for (const payment of orphanedPayments) {
                await base44.entities.Payment.delete(payment.id);
            }
            
            // Nur gültige Zahlungen zurückgeben
            return allPayments.filter(p => contractIds.has(p.contract_id));
        }
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

    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);
    const getContract = (contractId) => contracts.find(c => c.id === contractId);

    const statusConfig = {
        paid: { label: 'Bezahlt', color: 'bg-emerald-100 text-emerald-700' },
        partial: { label: 'Teilzahlung', color: 'bg-amber-100 text-amber-700' },
        pending: { label: 'Ausstehend', color: 'bg-blue-100 text-blue-700' },
        overdue: { label: 'Überfällig', color: 'bg-red-100 text-red-700' }
    };

    const paymentTypeLabels = {
        rent: 'Miete',
        deposit: 'Kaution',
        utilities_settlement: 'NK-Abrechnung',
        other: 'Sonstiges'
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredPayments = payments.filter(payment => {
        // Nur Zahlungen bis heute anzeigen
        if (payment.payment_date) {
            const paymentDate = parseISO(payment.payment_date);
            if (paymentDate > today) return false;
        }
        
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        
        if (!matchesStatus) return false;
        if (!searchTerm) return true;

        const tenant = getTenant(payment.tenant_id);
        const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}`.toLowerCase() : '';
        const reference = (payment.reference || '').toLowerCase();
        
        return tenantName.includes(searchTerm.toLowerCase()) || 
               reference.includes(searchTerm.toLowerCase());
    });

    const handleRegeneratePayments = async () => {
        setIsRegenerating(true);
        try {
            const count = await regenerateAllPayments();
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success(`${count} Zahlungen wurden erfolgreich aktualisiert`);
        } catch (error) {
            toast.error('Fehler beim Aktualisieren der Zahlungen');
        } finally {
            setIsRegenerating(false);
        }
    };

    // Calculate stats
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOverdue = payments.filter(p => p.status === 'overdue' || p.status === 'pending')
        .reduce((sum, p) => sum + ((p.expected_amount || 0) - (p.amount || 0)), 0);

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
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Zahlungen</h1>
                    <p className="text-slate-500 mt-1">{payments.length} Zahlungen erfasst</p>
                </div>
                <Button 
                    onClick={handleRegeneratePayments}
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
                            Alle Zahlungen aktualisieren
                        </>
                    )}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Eingegangene Zahlungen</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                        €{totalPaid.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        {payments.filter(p => p.status === 'paid').length} Zahlungen
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Ausstehend</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">
                        €{totalOverdue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        {payments.filter(p => p.status === 'pending' || p.status === 'overdue').length} Zahlungen
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Überfällig</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                        {payments.filter(p => p.status === 'overdue').length}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">Zahlungen</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Nach Mieter oder Referenz suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <Filter className="w-4 h-4 mr-2" />
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

            {/* Payments Table */}
            {filteredPayments.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="Keine Zahlungen gefunden"
                    description="Es wurden keine Zahlungen mit den ausgewählten Filtern gefunden."
                />
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Mieter</TableHead>
                                    <TableHead>Wohnung</TableHead>
                                    <TableHead>Monat</TableHead>
                                    <TableHead>Betrag</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Typ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((payment) => {
                                    const tenant = getTenant(payment.tenant_id);
                                    const unit = getUnit(payment.unit_id);
                                    const building = unit ? getBuilding(unit.building_id) : null;
                                    const status = statusConfig[payment.status] || statusConfig.pending;

                                    return (
                                        <TableRow key={payment.id} className="hover:bg-slate-50">
                                            <TableCell>
                                                {payment.payment_date && format(parseISO(payment.payment_date), 'dd.MM.yyyy')}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {tenant ? `${tenant.first_name} ${tenant.last_name}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {building && unit ? `${building.name} - ${unit.unit_number}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {payment.payment_month && format(parseISO(payment.payment_month + '-01'), 'MMM yyyy', { locale: de })}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                €{payment.amount?.toFixed(2)}
                                                {payment.expected_amount && payment.expected_amount !== payment.amount && (
                                                    <span className="text-xs text-slate-400 ml-1">
                                                        / €{payment.expected_amount.toFixed(2)}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={status.color}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {paymentTypeLabels[payment.payment_type] || payment.payment_type}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}