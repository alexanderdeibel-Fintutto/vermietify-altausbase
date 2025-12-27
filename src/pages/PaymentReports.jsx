import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function PaymentReports() {
    const [filters, setFilters] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        paymentType: 'all',
        tenantId: 'all',
        contractId: 'all',
        status: 'all'
    });

    const { data: payments = [], isLoading: paymentsLoading } = useQuery({
        queryKey: ['payments-reports'],
        queryFn: () => base44.entities.Payment.list('-payment_date', 1000)
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts-reports'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants-reports'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units-reports'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings-reports'],
        queryFn: () => base44.entities.Building.list()
    });

    const getTenantName = (tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId);
        return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
    };

    const getUnitInfo = (unitId) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return 'Unbekannt';
        const building = buildings.find(b => b.id === unit.building_id);
        return building ? `${building.name} - ${unit.unit_number}` : unit.unit_number;
    };

    const paymentTypeLabels = {
        rent: 'Miete',
        deposit: 'Kaution',
        utilities_settlement: 'Nebenkostenabrechnung',
        other: 'Sonstiges'
    };

    const statusLabels = {
        paid: 'Bezahlt',
        partial: 'Teilweise',
        pending: 'Ausstehend',
        overdue: 'Überfällig'
    };

    // Gefilterte Daten
    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            // Datumsfilter
            if (filters.startDate && filters.endDate) {
                const paymentDate = parseISO(payment.payment_date);
                const start = parseISO(filters.startDate);
                const end = parseISO(filters.endDate);
                if (!isWithinInterval(paymentDate, { start, end })) {
                    return false;
                }
            }

            // Zahlungsartfilter
            if (filters.paymentType !== 'all' && payment.payment_type !== filters.paymentType) {
                return false;
            }

            // Mieterfilter
            if (filters.tenantId !== 'all' && payment.tenant_id !== filters.tenantId) {
                return false;
            }

            // Vertragsfilter
            if (filters.contractId !== 'all' && payment.contract_id !== filters.contractId) {
                return false;
            }

            // Statusfilter
            if (filters.status !== 'all' && payment.status !== filters.status) {
                return false;
            }

            return true;
        });
    }, [payments, filters]);

    // Statistiken
    const stats = useMemo(() => {
        const totalIncome = filteredPayments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        const pendingAmount = filteredPayments
            .filter(p => p.status === 'pending' || p.status === 'overdue')
            .reduce((sum, p) => sum + (p.expected_amount || 0) - (p.amount || 0), 0);

        const partialAmount = filteredPayments
            .filter(p => p.status === 'partial')
            .reduce((sum, p) => sum + (p.expected_amount || 0) - (p.amount || 0), 0);

        return {
            totalIncome,
            pendingAmount,
            partialAmount,
            totalPayments: filteredPayments.length,
            paidCount: filteredPayments.filter(p => p.status === 'paid').length,
            pendingCount: filteredPayments.filter(p => p.status === 'pending' || p.status === 'overdue').length
        };
    }, [filteredPayments]);

    // CSV Export
    const exportToCSV = () => {
        const headers = [
            'Datum',
            'Mieter',
            'Einheit',
            'Zahlungsart',
            'Monat',
            'Erwarteter Betrag',
            'Gezahlter Betrag',
            'Status',
            'Referenz'
        ];

        const rows = filteredPayments.map(payment => [
            format(parseISO(payment.payment_date), 'dd.MM.yyyy'),
            getTenantName(payment.tenant_id),
            getUnitInfo(payment.unit_id),
            paymentTypeLabels[payment.payment_type] || payment.payment_type,
            payment.payment_month || '',
            (payment.expected_amount || 0).toFixed(2),
            (payment.amount || 0).toFixed(2),
            statusLabels[payment.status] || payment.status,
            payment.reference || ''
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.join(';'))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `zahlungsbericht_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.click();
        
        toast.success('Bericht als CSV exportiert');
    };

    if (paymentsLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Zahlungsberichte"
                subtitle="Berichte über Zahlungseingänge und -ausgänge"
            />

            {/* Filter Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                            <Label htmlFor="start-date">Von Datum</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="end-date">Bis Datum</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Zahlungsart</Label>
                            <Select
                                value={filters.paymentType}
                                onValueChange={(value) => setFilters({ ...filters, paymentType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle</SelectItem>
                                    <SelectItem value="rent">Miete</SelectItem>
                                    <SelectItem value="deposit">Kaution</SelectItem>
                                    <SelectItem value="utilities_settlement">Nebenkosten</SelectItem>
                                    <SelectItem value="other">Sonstiges</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Mieter</Label>
                            <Select
                                value={filters.tenantId}
                                onValueChange={(value) => setFilters({ ...filters, tenantId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Mieter</SelectItem>
                                    {tenants.map(tenant => (
                                        <SelectItem key={tenant.id} value={tenant.id}>
                                            {tenant.first_name} {tenant.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Status</SelectItem>
                                    <SelectItem value="paid">Bezahlt</SelectItem>
                                    <SelectItem value="partial">Teilweise</SelectItem>
                                    <SelectItem value="pending">Ausstehend</SelectItem>
                                    <SelectItem value="overdue">Überfällig</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Gesamteinnahmen</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    €{stats.totalIncome.toFixed(2)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-emerald-600" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {stats.paidCount} bezahlte Zahlungen
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Ausstehend</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    €{stats.pendingAmount.toFixed(2)}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-amber-600" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {stats.pendingCount} offene Zahlungen
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Teilzahlungen</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    €{stats.partialAmount.toFixed(2)}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Gesamt Zahlungen</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {stats.totalPayments}
                                </p>
                            </div>
                            <FileText className="w-8 h-8 text-slate-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
                <Button
                    onClick={exportToCSV}
                    disabled={filteredPayments.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Als CSV exportieren
                </Button>
            </div>

            {/* Payments Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Mieter</TableHead>
                                    <TableHead>Einheit</TableHead>
                                    <TableHead>Art</TableHead>
                                    <TableHead>Monat</TableHead>
                                    <TableHead className="text-right">Erwartet</TableHead>
                                    <TableHead className="text-right">Gezahlt</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Referenz</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                                            Keine Zahlungen gefunden
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {format(parseISO(payment.payment_date), 'dd.MM.yyyy', { locale: de })}
                                            </TableCell>
                                            <TableCell>{getTenantName(payment.tenant_id)}</TableCell>
                                            <TableCell>{getUnitInfo(payment.unit_id)}</TableCell>
                                            <TableCell>
                                                {paymentTypeLabels[payment.payment_type] || payment.payment_type}
                                            </TableCell>
                                            <TableCell>{payment.payment_month || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                €{(payment.expected_amount || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                €{(payment.amount || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                    payment.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                                                    payment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {statusLabels[payment.status] || payment.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {payment.reference || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}