import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreVertical, Pencil, Trash2, FileText, Building2, TrendingUp, TrendingDown, Filter, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import InvoiceForm from '@/components/invoices/InvoiceForm';

const categoryLabels = {
    maintenance: 'Instandhaltung',
    utilities: 'Nebenkosten',
    insurance: 'Versicherungen',
    tax: 'Steuern',
    property_management: 'Hausverwaltung',
    marketing: 'Marketing',
    legal: 'Rechtsberatung',
    financing: 'Finanzierung',
    other_expense: 'Sonstige Ausgabe',
    other_income: 'Sonstige Einnahme'
};

export default function Invoices() {
    const queryClient = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [deleteInvoice, setDeleteInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [buildingFilter, setBuildingFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const { data: invoices = [], isLoading } = useQuery({
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

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Invoice.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setFormOpen(false);
            toast.success('Rechnung erstellt');
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen');
            console.error(error);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setFormOpen(false);
            setEditingInvoice(null);
            toast.success('Rechnung aktualisiert');
        },
        onError: (error) => {
            toast.error('Fehler beim Aktualisieren');
            console.error(error);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Invoice.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setDeleteInvoice(null);
            toast.success('Rechnung gelöscht');
        },
        onError: (error) => {
            toast.error('Fehler beim Löschen');
            console.error(error);
        }
    });

    const handleSubmit = (data) => {
        if (editingInvoice) {
            updateMutation.mutate({ id: editingInvoice.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        let filtered = invoices;

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(inv => inv.type === typeFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(inv => inv.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(inv => inv.category === categoryFilter);
        }

        // Building filter
        if (buildingFilter !== 'all') {
            filtered = filtered.filter(inv => {
                if (inv.building_id === buildingFilter) return true;
                if (inv.unit_id) {
                    const unit = units.find(u => u.id === inv.unit_id);
                    return unit?.building_id === buildingFilter;
                }
                return false;
            });
        }

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(inv => 
                inv.description?.toLowerCase().includes(term) ||
                inv.reference?.toLowerCase().includes(term) ||
                inv.accounting_notes?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [invoices, typeFilter, statusFilter, categoryFilter, buildingFilter, searchTerm, units]);

    // Calculate statistics
    const stats = useMemo(() => {
        const expenses = filteredInvoices
            .filter(inv => inv.type === 'expense')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);
        
        const income = filteredInvoices
            .filter(inv => inv.type === 'other_income')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const pending = filteredInvoices
            .filter(inv => inv.status === 'pending')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const operatingCost = filteredInvoices
            .filter(inv => inv.operating_cost_relevant)
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        return { expenses, income, pending, operatingCost };
    }, [filteredInvoices]);

    const getBuilding = (invoice) => {
        if (invoice.building_id) {
            return buildings.find(b => b.id === invoice.building_id);
        }
        if (invoice.unit_id) {
            const unit = units.find(u => u.id === invoice.unit_id);
            if (unit) {
                return buildings.find(b => b.id === unit.building_id);
            }
        }
        return null;
    };

    const getUnit = (invoice) => {
        if (invoice.unit_id) {
            return units.find(u => u.id === invoice.unit_id);
        }
        return null;
    };

    const getStatusBadge = (status) => {
        const variants = {
            paid: 'bg-emerald-100 text-emerald-700',
            pending: 'bg-amber-100 text-amber-700',
            overdue: 'bg-red-100 text-red-700'
        };
        const labels = {
            paid: 'Bezahlt',
            pending: 'Ausstehend',
            overdue: 'Überfällig'
        };
        return <Badge className={variants[status]}>{labels[status]}</Badge>;
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
                        Rechnungen & Belege
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Beleg' : 'Belege'}
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setEditingInvoice(null);
                        setFormOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Neue Rechnung
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Ausgaben</p>
                                <p className="text-2xl font-bold text-red-600">
                                    €{stats.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
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
                                <p className="text-sm text-slate-600">Sonstige Einnahmen</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    €{stats.income.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
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
                                <p className="text-sm text-slate-600">Ausstehend</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    €{stats.pending.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <FileText className="w-8 h-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Betriebskosten</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    €{stats.operatingCost.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <Building2 className="w-8 h-8 text-blue-500" />
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
                                    placeholder="Suche nach Beschreibung, Referenz..."
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
                                    <SelectItem value="expense">Ausgaben</SelectItem>
                                    <SelectItem value="other_income">Sonstige Einnahmen</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full lg:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Status</SelectItem>
                                    <SelectItem value="pending">Ausstehend</SelectItem>
                                    <SelectItem value="paid">Bezahlt</SelectItem>
                                    <SelectItem value="overdue">Überfällig</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Mehr Filter
                            </Button>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <label className="text-xs font-medium mb-2 block">Kategorie</label>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Alle Kategorien" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Alle Kategorien</SelectItem>
                                            {Object.entries(categoryLabels).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

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

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredInvoices.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Keine Rechnungen gefunden
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Datum</TableHead>
                                        <TableHead>Typ</TableHead>
                                        <TableHead>Beschreibung</TableHead>
                                        <TableHead>Objekt</TableHead>
                                        <TableHead>Kategorie</TableHead>
                                        <TableHead className="text-right">Betrag</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>NK</TableHead>
                                        <TableHead className="text-right">Aktionen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.map((invoice) => {
                                        const building = getBuilding(invoice);
                                        const unit = getUnit(invoice);

                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">
                                                    {invoice.invoice_date ? format(parseISO(invoice.invoice_date), 'dd.MM.yyyy', { locale: de }) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.type === 'expense' ? (
                                                        <Badge variant="outline" className="border-red-300 text-red-700">
                                                            Ausgabe
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                                                            Einnahme
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{invoice.description}</p>
                                                        {invoice.reference && (
                                                            <p className="text-xs text-slate-500">{invoice.reference}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium">{building?.name || '-'}</p>
                                                        {unit && (
                                                            <p className="text-xs text-slate-500">{unit.unit_number}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {categoryLabels[invoice.category] || invoice.category}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    <span className={invoice.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}>
                                                        {invoice.type === 'expense' ? '-' : '+'}€{invoice.amount?.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(invoice.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.operating_cost_relevant && (
                                                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                            ✓
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => {
                                                                setEditingInvoice(invoice);
                                                                setFormOpen(true);
                                                            }}>
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                Bearbeiten
                                                            </DropdownMenuItem>
                                                            {invoice.document_url && (
                                                                <DropdownMenuItem onClick={() => window.open(invoice.document_url, '_blank')}>
                                                                    <Download className="w-4 h-4 mr-2" />
                                                                    Dokument öffnen
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem 
                                                                onClick={() => setDeleteInvoice(invoice)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Löschen
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

            {/* Form Dialog */}
            <InvoiceForm
                open={formOpen}
                onOpenChange={setFormOpen}
                invoice={editingInvoice}
                buildings={buildings}
                units={units}
                contracts={contracts}
                onSuccess={handleSubmit}
            />

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rechnung löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie diese Rechnung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteInvoice.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}