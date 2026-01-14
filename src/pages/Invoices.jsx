import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { Plus, Search, MoreVertical, Pencil, Trash2, FileText, Building2, TrendingUp, TrendingDown, Filter, Download, Tag, Users, Sparkles, HelpCircle, Smartphone } from 'lucide-react';
import UmlagefaehigBadge from '@/components/shared/UmlagefaehigBadge';
import InvoiceCategoryAssistant from '@/components/invoices/InvoiceCategoryAssistant';
import { toast } from 'sonner';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceFormWithTaxLibrary from '@/components/invoices/InvoiceFormWithTaxLibrary';
import IntelligentInvoiceWizard from '@/components/invoices/IntelligentInvoiceWizard';
import CostTypeForm from '@/components/cost-types/CostTypeForm';
import RecipientForm from '@/components/recipients/RecipientForm';
import DATEVExportButton from '@/components/invoices/DATEVExportButton';
import EmptyStateWithAction from '@/components/shared/EmptyStateWithAction';
import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';
import FloatingActionMenu from '@/components/shared/FloatingActionMenu';
import ContextHelp from '@/components/shared/ContextHelp';
import BulkInvoiceCategorizationDialog from '@/components/bulk/BulkInvoiceCategorizationDialog';
import BulkExportDialog from '@/components/bulk/BulkExportDialog';

export default function Invoices() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('invoices');
    const [bulkCategorizationOpen, setBulkCategorizationOpen] = useState(false);
    const [bulkExportOpen, setBulkExportOpen] = useState(false);

    // Keyboard shortcuts
    useKeyboardShortcuts({
      onNew: () => {
        if (activeTab === 'invoices') {
          setEditingInvoice(null);
          setInvoiceFormOpen(true);
        }
      },
      onSearch: () => {
        // Focus search field (implementation depends on structure)
        document.querySelector('[data-search-input]')?.focus();
      },
      onEscape: () => {
        setInvoiceFormOpen(false);
        setCostTypeFormOpen(false);
        setRecipientFormOpen(false);
      }
    });
    const [selectedInvoices, setSelectedInvoices] = useState(new Set());
    
    // Invoice state
    const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
    const [intelligentWizardOpen, setIntelligentWizardOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [deleteInvoice, setDeleteInvoice] = useState(null);
    const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [buildingFilter, setBuildingFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Cost Type state
    const [costTypeFormOpen, setCostTypeFormOpen] = useState(false);
    const [editingCostType, setEditingCostType] = useState(null);
    const [deleteCostType, setDeleteCostType] = useState(null);
    const [costTypeSearchTerm, setCostTypeSearchTerm] = useState('');
    const [costTypeFilter, setCostTypeFilter] = useState('all');
    const [mainCategoryFilter, setMainCategoryFilter] = useState('all');

    // DATEV Export state
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState('all');

    // Recipient state
    const [recipientFormOpen, setRecipientFormOpen] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState(null);
    const [deleteRecipient, setDeleteRecipient] = useState(null);
    const [recipientSearchTerm, setRecipientSearchTerm] = useState('');

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

    const { data: costTypes = [], isLoading: loadingCostTypes } = useQuery({
        queryKey: ['cost-types'],
        queryFn: () => base44.entities.CostType.list()
    });

    const { data: euerCategories = [] } = useQuery({
        queryKey: ['euer-categories'],
        queryFn: () => base44.entities.EuerCategory.list()
    });

    const { data: savedRecipients = [] } = useQuery({
        queryKey: ['recipients'],
        queryFn: () => base44.entities.Recipient.list()
    });

    // Invoice mutations
    const createInvoiceMutation = useMutation({
        mutationFn: (data) => base44.entities.Invoice.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setInvoiceFormOpen(false);
            toast.success('Rechnung erstellt');
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen');
            console.error(error);
        }
    });

    const updateInvoiceMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setInvoiceFormOpen(false);
            setEditingInvoice(null);
            toast.success('Rechnung aktualisiert');
        },
        onError: (error) => {
            toast.error('Fehler beim Aktualisieren');
            console.error(error);
        }
    });

    const deleteInvoiceMutation = useMutation({
        mutationFn: (id) => base44.entities.Invoice.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setDeleteInvoice(null);
            setSelectedInvoices(new Set());
            toast.success('Rechnung gelöscht');
        },
        onError: (error) => {
            toast.error('Fehler beim Löschen');
            console.error(error);
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids) => {
            await Promise.all(ids.map(id => base44.entities.Invoice.delete(id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setSelectedInvoices(new Set());
            toast.success(`${selectedInvoices.size} Rechnungen gelöscht`);
        },
        onError: () => {
            toast.error('Fehler beim Löschen');
        }
    });

    // Cost Type mutations
    const createCostTypeMutation = useMutation({
        mutationFn: (data) => base44.entities.CostType.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cost-types'] });
            setCostTypeFormOpen(false);
            toast.success('Kostenart erstellt');
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen');
            console.error(error);
        }
    });

    const updateCostTypeMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.CostType.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cost-types'] });
            setCostTypeFormOpen(false);
            setEditingCostType(null);
            toast.success('Kostenart aktualisiert');
        },
        onError: (error) => {
            toast.error('Fehler beim Aktualisieren');
            console.error(error);
        }
    });

    const deleteCostTypeMutation = useMutation({
        mutationFn: (id) => base44.entities.CostType.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cost-types'] });
            setDeleteCostType(null);
            toast.success('Kostenart gelöscht');
        },
        onError: (error) => {
            toast.error('Fehler beim Löschen');
            console.error(error);
        }
    });

    // Recipient mutations
    const createRecipientMutation = useMutation({
        mutationFn: (data) => base44.entities.Recipient.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipients'] });
            setRecipientFormOpen(false);
            toast.success('Empfänger erstellt');
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen');
            console.error(error);
        }
    });

    const updateRecipientMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Recipient.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipients'] });
            setRecipientFormOpen(false);
            setEditingRecipient(null);
            toast.success('Empfänger aktualisiert');
        },
        onError: (error) => {
            toast.error('Fehler beim Aktualisieren');
            console.error(error);
        }
    });

    const deleteRecipientMutation = useMutation({
        mutationFn: (id) => base44.entities.Recipient.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipients'] });
            setDeleteRecipient(null);
            toast.success('Empfänger gelöscht');
        },
        onError: (error) => {
            toast.error('Fehler beim Löschen');
            console.error(error);
        }
    });

    const handleInvoiceSubmit = (data) => {
        console.log('handleInvoiceSubmit called with data:', data);
        console.log('editingInvoice:', editingInvoice);
        
        if (editingInvoice) {
            console.log('Calling updateInvoiceMutation');
            updateInvoiceMutation.mutate({ id: editingInvoice.id, data });
        } else {
            console.log('Calling createInvoiceMutation');
            createInvoiceMutation.mutate(data);
        }
    };

    const handleCostTypeSubmit = (data) => {
        if (editingCostType) {
            updateCostTypeMutation.mutate({ id: editingCostType.id, data });
        } else {
            createCostTypeMutation.mutate(data);
        }
    };

    const handleRecipientSubmit = (data) => {
        if (editingRecipient) {
            updateRecipientMutation.mutate({ id: editingRecipient.id, data });
        } else {
            createRecipientMutation.mutate(data);
        }
    };

    // Get unique recipients (combine from invoices and saved recipients)
    const recipients = useMemo(() => {
        const recipientMap = new Map();
        
        // Add from invoices
        invoices.forEach(inv => {
            if (inv.recipient) {
                const existing = recipientMap.get(inv.recipient);
                if (existing) {
                    existing.count++;
                    existing.totalAmount += inv.amount || 0;
                    existing.lastInvoiceDate = inv.invoice_date > existing.lastInvoiceDate ? inv.invoice_date : existing.lastInvoiceDate;
                } else {
                    recipientMap.set(inv.recipient, {
                        name: inv.recipient,
                        count: 1,
                        totalAmount: inv.amount || 0,
                        lastInvoiceDate: inv.invoice_date,
                        savedId: null
                    });
                }
            }
        });

        // Add saved recipients (even if no invoices)
        savedRecipients.forEach(saved => {
            const existing = recipientMap.get(saved.name);
            if (existing) {
                existing.savedId = saved.id;
                existing.notes = saved.notes;
            } else {
                recipientMap.set(saved.name, {
                    name: saved.name,
                    count: 0,
                    totalAmount: 0,
                    lastInvoiceDate: null,
                    savedId: saved.id,
                    notes: saved.notes
                });
            }
        });

        return Array.from(recipientMap.values()).sort((a, b) => b.count - a.count);
    }, [invoices, savedRecipients]);

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        let filtered = invoices;

        if (typeFilter !== 'all') {
            filtered = filtered.filter(inv => inv.type === typeFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(inv => inv.status === statusFilter);
        }

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

        if (invoiceSearchTerm) {
            const term = invoiceSearchTerm.toLowerCase();
            filtered = filtered.filter(inv => 
                inv.description?.toLowerCase().includes(term) ||
                inv.reference?.toLowerCase().includes(term) ||
                inv.recipient?.toLowerCase().includes(term) ||
                inv.accounting_notes?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [invoices, typeFilter, statusFilter, buildingFilter, invoiceSearchTerm, units]);

    // Filter cost types
    const filteredCostTypes = useMemo(() => {
        let filtered = costTypes;

        if (costTypeFilter !== 'all') {
            filtered = filtered.filter(ct => ct.type === costTypeFilter);
        }

        if (mainCategoryFilter !== 'all') {
            filtered = filtered.filter(ct => ct.main_category === mainCategoryFilter);
        }

        if (costTypeSearchTerm) {
            const term = costTypeSearchTerm.toLowerCase();
            filtered = filtered.filter(ct => 
                ct.main_category?.toLowerCase().includes(term) ||
                ct.sub_category?.toLowerCase().includes(term)
            );
        }

        return filtered.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'income' ? -1 : 1;
            }
            if (a.main_category !== b.main_category) {
                return a.main_category.localeCompare(b.main_category);
            }
            return a.sub_category.localeCompare(b.sub_category);
        });
    }, [costTypes, costTypeFilter, mainCategoryFilter, costTypeSearchTerm]);

    // Filter recipients
    const filteredRecipients = useMemo(() => {
        if (!recipientSearchTerm) return recipients;
        
        const term = recipientSearchTerm.toLowerCase();
        return recipients.filter(r => r.name.toLowerCase().includes(term));
    }, [recipients, recipientSearchTerm]);

    // Statistics
    const invoiceStats = useMemo(() => {
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

    const costTypeStats = useMemo(() => {
        const expenses = costTypes.filter(ct => ct.type === 'expense').length;
        const income = costTypes.filter(ct => ct.type === 'income').length;
        const distributable = costTypes.filter(ct => ct.distributable).length;
        const taxDeductible = costTypes.filter(ct => ct.tax_deductible).length;

        return { expenses, income, distributable, taxDeductible };
    }, [costTypes]);

    const mainCategories = useMemo(() => {
        const categories = new Set(costTypes.map(ct => ct.main_category));
        return Array.from(categories).sort();
    }, [costTypes]);

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

    const getCostType = (costTypeId) => {
        return costTypes.find(ct => ct.id === costTypeId);
    };

    const getEuerCategory = (id) => {
        return euerCategories.find(ec => ec.id === id);
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

    if (loadingInvoices || loadingCostTypes) {
        return <div className="p-8">Lädt...</div>;
    }

    const floatingActions = [
      {
        id: 'new-invoice',
        label: 'Neue Rechnung',
        icon: FileText,
        onClick: () => {
          setEditingInvoice(null);
          setInvoiceFormOpen(true);
        }
      },
      {
        id: 'smart-invoice',
        label: 'Smart-Erfassung',
        icon: Sparkles,
        onClick: () => setIntelligentWizardOpen(true),
        className: 'bg-blue-600 hover:bg-blue-700'
      }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">
                        Rechnungen & Belege
                    </h1>
                    <p className="text-sm font-extralight text-slate-400 mt-1">
                        {activeTab === 'invoices' && `${filteredInvoices.length} ${filteredInvoices.length === 1 ? 'Beleg' : 'Belege'}`}
                        {activeTab === 'cost-types' && `${filteredCostTypes.length} ${filteredCostTypes.length === 1 ? 'Kostenart' : 'Kostenarten'}`}
                        {activeTab === 'recipients' && `${filteredRecipients.length} ${filteredRecipients.length === 1 ? 'Empfänger' : 'Empfänger'}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'invoices' && (
                        <Button 
                            onClick={() => {
                                setEditingInvoice(null);
                                setIntelligentWizardOpen(true);
                            }}
                            className="bg-slate-700 hover:bg-slate-800 gap-2 font-extralight"
                        >
                            <Sparkles className="w-4 h-4" />
                            Smart-Erfassung
                        </Button>
                    )}
                    <Button 
                        onClick={() => {
                            if (activeTab === 'invoices') {
                                setEditingInvoice(null);
                                setInvoiceFormOpen(true);
                            } else if (activeTab === 'cost-types') {
                                setEditingCostType(null);
                                setCostTypeFormOpen(true);
                            } else if (activeTab === 'recipients') {
                                setEditingRecipient(null);
                                setRecipientFormOpen(true);
                            }
                        }}
                        className="bg-slate-700 hover:bg-slate-800 gap-2 font-extralight"
                    >
                        <Plus className="w-4 h-4" />
                        {activeTab === 'invoices' && 'Neue Rechnung'}
                        {activeTab === 'cost-types' && 'Neue Kostenart'}
                        {activeTab === 'recipients' && 'Neuer Empfänger'}
                    </Button>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border border-slate-200 flex justify-between">
                    <div className="flex gap-2">
                        <TabsTrigger value="invoices" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Rechnungen
                        </TabsTrigger>
                    <TabsTrigger value="cost-types" className="gap-2">
                        <Tag className="w-4 h-4" />
                        Kostenarten
                    </TabsTrigger>
                    <TabsTrigger value="recipients" className="gap-2">
                        <Users className="w-4 h-4" />
                        Empfänger
                    </TabsTrigger>
                    </div>
                    <div className="flex gap-2">
                        {selectedInvoices.size > 0 && activeTab === 'invoices' && (
                            <>
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBulkCategorizationOpen(true)}
                                    className="gap-2"
                                >
                                    <Tag className="w-4 h-4" />
                                    Kategorisieren ({selectedInvoices.size})
                                </Button>
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBulkExportOpen(true)}
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export ({selectedInvoices.size})
                                </Button>
                                <Button 
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => bulkDeleteMutation.mutate(Array.from(selectedInvoices))}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Löschen ({selectedInvoices.size})
                                </Button>
                            </>
                        )}
                        {activeTab === 'invoices' && dateRangeStart && dateRangeEnd && (
                            <DATEVExportButton 
                                buildingId={buildingFilter !== 'all' ? buildingFilter : null}
                                startDate={dateRangeStart}
                                endDate={dateRangeEnd}
                            />
                        )}
                    </div>
                </TabsList>

                {/* INVOICES TAB */}
                <TabsContent value="invoices" className="space-y-6 mt-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Ausgaben</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            €{invoiceStats.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
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
                                            €{invoiceStats.income.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
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
                                            €{invoiceStats.pending.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
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
                                            €{invoiceStats.operatingCost.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
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
                                            data-search-input
                                            placeholder="Suche nach Beschreibung, Referenz, Empfänger... (Ctrl+F)"
                                            value={invoiceSearchTerm}
                                            onChange={(e) => setInvoiceSearchTerm(e.target.value)}
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
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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
                                                         <div>
                                                             <label className="text-xs font-medium mb-2 block">Von</label>
                                                             <Input type="date" value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} />
                                                         </div>
                                                         <div>
                                                             <label className="text-xs font-medium mb-2 block">Bis</label>
                                                             <Input type="date" value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} />
                                                         </div>
                                                     </div>
                                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoices Table */}
                    <Card>
                        <CardContent className="p-0">
                            {filteredInvoices.length === 0 ? (
                                invoices.length === 0 ? (
                                    <EmptyStateWithAction
                                        icon={FileText}
                                        title="Noch keine Rechnungen"
                                        description="Beginnen Sie mit der Erfassung Ihrer ersten Rechnung zur Verwaltung von Ausgaben."
                                        actionLabel="Erste Rechnung hinzufügen"
                                        onAction={() => setInvoiceFormOpen(true)}
                                        tips={[
                                            "Erfassen Sie regelmäßig Rechnungen, um einen Überblick über Ihre Ausgaben zu behalten",
                                            "Jede Rechnung sollte einer Kostenart zugeordnet werden",
                                            "Markieren Sie Kosten als 'umlagefähig', um diese auf Mieter zu verteilen"
                                        ]}
                                    />
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        Keine Rechnungen mit den aktuellen Filtern gefunden.
                                    </div>
                                )
                            ) : (
                                <div className="overflow-x-auto -mx-6 sm:mx-0 px-4 sm:px-0">
                                    <Table className="text-xs sm:text-sm">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-8">
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedInvoices(new Set(filteredInvoices.map(i => i.id)));
                                                            } else {
                                                                setSelectedInvoices(new Set());
                                                            }
                                                        }}
                                                    />
                                                </TableHead>
                                                <TableHead className="hidden sm:table-cell">Datum</TableHead>
                                                <TableHead>Typ</TableHead>
                                                <TableHead className="hidden md:table-cell">Empfänger</TableHead>
                                                <TableHead className="hidden lg:table-cell">Beschreibung</TableHead>
                                                <TableHead className="hidden xl:table-cell">Objekt</TableHead>
                                                <TableHead className="hidden xl:table-cell">Kostenart</TableHead>
                                                <TableHead className="text-right">Betrag</TableHead>
                                                <TableHead className="hidden sm:table-cell">Status</TableHead>
                                                <TableHead className="hidden md:table-cell">NK</TableHead>
                                                <TableHead className="text-right">Aktionen</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredInvoices.map((invoice) => {
                                                const building = getBuilding(invoice);
                                                const unit = getUnit(invoice);
                                                const costType = getCostType(invoice.cost_type_id);

                                                return (
                                                    <TableRow key={invoice.id} className={selectedInvoices.has(invoice.id) ? 'bg-blue-50' : ''}>
                                                         <TableCell className="w-8">
                                                             <input 
                                                                 type="checkbox"
                                                                 checked={selectedInvoices.has(invoice.id)}
                                                                 onChange={(e) => {
                                                                     const newSelected = new Set(selectedInvoices);
                                                                     if (e.target.checked) {
                                                                         newSelected.add(invoice.id);
                                                                     } else {
                                                                         newSelected.delete(invoice.id);
                                                                     }
                                                                     setSelectedInvoices(newSelected);
                                                                 }}
                                                             />
                                                         </TableCell>
                                                         <TableCell className="hidden sm:table-cell font-medium">
                                                             {invoice.invoice_date ? (() => {
                                                                 try {
                                                                     return format(parseISO(invoice.invoice_date), 'dd.MM.yyyy', { locale: de });
                                                                 } catch {
                                                                     return invoice.invoice_date;
                                                                 }
                                                             })() : '-'}
                                                         </TableCell>
                                                         <TableCell>
                                                             {invoice.type === 'expense' ? (
                                                                 <Badge variant="outline" className="border-red-300 text-red-700 text-xs">
                                                                     Ausgabe
                                                                 </Badge>
                                                             ) : (
                                                                 <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">
                                                                     Einnahme
                                                                 </Badge>
                                                             )}
                                                         </TableCell>
                                                         <TableCell className="hidden md:table-cell text-sm">
                                                             {invoice.recipient || '-'}
                                                         </TableCell>
                                                         <TableCell className="hidden lg:table-cell">
                                                             <div className="text-sm">
                                                                 <p className="font-medium">{invoice.description}</p>
                                                                 {invoice.reference && (
                                                                     <p className="text-xs text-slate-500">{invoice.reference}</p>
                                                                 )}
                                                             </div>
                                                         </TableCell>
                                                         <TableCell className="hidden xl:table-cell">
                                                             <div className="text-sm">
                                                                 <p className="font-medium">{building?.name || '-'}</p>
                                                                 {unit && (
                                                                     <p className="text-xs text-slate-500">{unit.unit_number}</p>
                                                                 )}
                                                             </div>
                                                         </TableCell>
                                                         <TableCell className="hidden xl:table-cell text-sm">
                                                             {invoice.cost_category_id ? (
                                                                 <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">
                                                                     Tax: {invoice.cost_category_id}
                                                                 </Badge>
                                                             ) : costType ? (
                                                                 <div>
                                                                     <p className="font-medium text-xs">{costType.main_category}</p>
                                                                     <p className="text-xs text-slate-500">{costType.sub_category}</p>
                                                                 </div>
                                                             ) : '-'}
                                                         </TableCell>
                                                         <TableCell className="text-right font-semibold text-sm">
                                                             <span className={invoice.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}>
                                                                 {invoice.type === 'expense' ? '-' : '+'}€{invoice.amount?.toFixed(2)}
                                                             </span>
                                                         </TableCell>
                                                         <TableCell className="hidden sm:table-cell">
                                                             {getStatusBadge(invoice.status)}
                                                         </TableCell>
                                                         <TableCell className="hidden md:table-cell">
                                                             <UmlagefaehigBadge value={invoice.operating_cost_relevant ? 'yes' : 'no'} showIcon={false} />
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
                                                                        setInvoiceFormOpen(true);
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
                </TabsContent>

                {/* COST TYPES TAB */}
                <TabsContent value="cost-types" className="space-y-6 mt-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Ausgaben</p>
                                        <p className="text-2xl font-bold text-red-600">{costTypeStats.expenses}</p>
                                    </div>
                                    <TrendingDown className="w-8 h-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Einnahmen</p>
                                        <p className="text-2xl font-bold text-emerald-600">{costTypeStats.income}</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Umlagefähig</p>
                                        <p className="text-2xl font-bold text-blue-600">{costTypeStats.distributable}</p>
                                    </div>
                                    <Tag className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Steuerlich absetzbar</p>
                                        <p className="text-2xl font-bold text-purple-600">{costTypeStats.taxDeductible}</p>
                                    </div>
                                    <Tag className="w-8 h-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        placeholder="Suche nach Kategorie..."
                                        value={costTypeSearchTerm}
                                        onChange={(e) => setCostTypeSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={costTypeFilter} onValueChange={setCostTypeFilter}>
                                    <SelectTrigger className="w-full lg:w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Alle Typen</SelectItem>
                                        <SelectItem value="expense">Ausgaben</SelectItem>
                                        <SelectItem value="income">Einnahmen</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={mainCategoryFilter} onValueChange={setMainCategoryFilter}>
                                    <SelectTrigger className="w-full lg:w-64">
                                        <SelectValue placeholder="Hauptkategorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Alle Hauptkategorien</SelectItem>
                                        {mainCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cost Types Table */}
                    <Card>
                        <CardContent className="p-0">
                            {filteredCostTypes.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    Keine Kostenarten gefunden
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Typ</TableHead>
                                                <TableHead>Hauptkategorie</TableHead>
                                                <TableHead>Kategorie</TableHead>
                                                <TableHead>MwSt.</TableHead>
                                                <TableHead>Umlagefähig</TableHead>
                                                <TableHead>Umlageschlüssel</TableHead>
                                                <TableHead>EÜR</TableHead>
                                                <TableHead className="text-right">Aktionen</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCostTypes.map((costType) => {
                                                const euerCat = getEuerCategory(costType.euer_category_id);

                                                return (
                                                    <TableRow key={costType.id}>
                                                        <TableCell>
                                                            {costType.type === 'expense' ? (
                                                                <Badge variant="outline" className="border-red-300 text-red-700">
                                                                    Ausgabe
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                                                                    Einnahme
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {costType.main_category}
                                                        </TableCell>
                                                        <TableCell>
                                                            {costType.sub_category}
                                                        </TableCell>
                                                        <TableCell>
                                                            {costType.vat_rate > 0 ? `${(costType.vat_rate * 100).toFixed(0)}%` : 'nein'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {costType.distributable ? (
                                                                <Badge className="bg-blue-100 text-blue-700">ja</Badge>
                                                            ) : (
                                                                <span className="text-slate-400">nein</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {costType.distributable && costType.distribution_key !== 'none' 
                                                                ? costType.distribution_key 
                                                                : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {euerCat ? (
                                                                <div>
                                                                    <p className="font-medium">{euerCat.parent_category}</p>
                                                                    <p className="text-xs text-slate-500">{euerCat.name}</p>
                                                                </div>
                                                            ) : '-'}
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
                                                                        setEditingCostType(costType);
                                                                        setCostTypeFormOpen(true);
                                                                    }}>
                                                                        <Pencil className="w-4 h-4 mr-2" />
                                                                        Bearbeiten
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => setDeleteCostType(costType)}
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
                </TabsContent>

                {/* RECIPIENTS TAB */}
                <TabsContent value="recipients" className="space-y-6 mt-6">
                    {/* Search */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Suche nach Empfänger..."
                                    value={recipientSearchTerm}
                                    onChange={(e) => setRecipientSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recipients Table */}
                    <Card>
                        <CardContent className="p-0">
                            {filteredRecipients.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    Keine Empfänger gefunden
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Empfänger</TableHead>
                                                <TableHead className="text-right">Anzahl Rechnungen</TableHead>
                                                <TableHead className="text-right">Gesamtbetrag</TableHead>
                                                <TableHead>Letzte Rechnung</TableHead>
                                                <TableHead className="text-right">Aktionen</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRecipients.map((recipient, idx) => {
                                                const savedData = savedRecipients.find(s => s.id === recipient.savedId);
                                                
                                                return (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{recipient.name}</p>
                                                                {savedData?.category && (
                                                                    <Badge variant="outline" className="text-xs mt-1">
                                                                        {savedData.category}
                                                                    </Badge>
                                                                )}
                                                                {savedData?.email && (
                                                                    <p className="text-xs text-slate-500 mt-1">{savedData.email}</p>
                                                                )}
                                                                {savedData?.phone && (
                                                                    <p className="text-xs text-slate-500">{savedData.phone}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {recipient.count}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            €{recipient.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell>
                                                            {recipient.lastInvoiceDate ? (() => {
                                                                try {
                                                                    return format(parseISO(recipient.lastInvoiceDate), 'dd.MM.yyyy', { locale: de });
                                                                } catch {
                                                                    return recipient.lastInvoiceDate;
                                                                }
                                                            })() : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {recipient.savedId ? (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => {
                                                                            setEditingRecipient(savedData);
                                                                            setRecipientFormOpen(true);
                                                                        }}>
                                                                            <Pencil className="w-4 h-4 mr-2" />
                                                                            Bearbeiten
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => setDeleteRecipient({
                                                                                id: recipient.savedId,
                                                                                name: recipient.name
                                                                            })}
                                                                            className="text-red-600"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Löschen
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            ) : (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingRecipient({ name: recipient.name });
                                                                        setRecipientFormOpen(true);
                                                                    }}
                                                                >
                                                                    Details hinzufügen
                                                                </Button>
                                                            )}
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
                </TabsContent>
            </Tabs>
            </motion.div>

            {/* Invoice Form Dialog */}
            <InvoiceFormWithTaxLibrary
                open={invoiceFormOpen}
                onOpenChange={setInvoiceFormOpen}
                invoice={editingInvoice}
                buildings={buildings}
                units={units}
                contracts={contracts}
                onSuccess={handleInvoiceSubmit}
            />

            {/* Intelligent Invoice Wizard */}
            <IntelligentInvoiceWizard
                open={intelligentWizardOpen}
                onOpenChange={setIntelligentWizardOpen}
            />

            {/* Cost Type Form Dialog */}
            <CostTypeForm
                open={costTypeFormOpen}
                onOpenChange={setCostTypeFormOpen}
                costType={editingCostType}
                euerCategories={euerCategories}
                onSuccess={handleCostTypeSubmit}
            />

            {/* Recipient Form Dialog */}
            <RecipientForm
                open={recipientFormOpen}
                onOpenChange={setRecipientFormOpen}
                recipient={editingRecipient}
                onSuccess={handleRecipientSubmit}
                isLoading={createRecipientMutation.isPending || updateRecipientMutation.isPending}
            />

            {/* Floating Action Menu */}
            <FloatingActionMenu actions={floatingActions} />

            {/* Bulk Categorization Dialog */}
            <BulkInvoiceCategorizationDialog
                open={bulkCategorizationOpen}
                onOpenChange={setBulkCategorizationOpen}
                selectedInvoices={filteredInvoices.filter(i => selectedInvoices.has(i.id))}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['invoices'] });
                    setSelectedInvoices(new Set());
                }}
            />

            {/* Bulk Export Dialog */}
            <BulkExportDialog
                open={bulkExportOpen}
                onOpenChange={setBulkExportOpen}
                data={filteredInvoices.filter(i => selectedInvoices.has(i.id))}
                entityType="Rechnungen"
                filename="rechnungen_export"
            />

            {/* Delete Invoice Dialog */}
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
                            onClick={() => deleteInvoiceMutation.mutate(deleteInvoice.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Cost Type Dialog */}
            <AlertDialog open={!!deleteCostType} onOpenChange={() => setDeleteCostType(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kostenart löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie diese Kostenart wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteCostTypeMutation.mutate(deleteCostType.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Recipient Dialog */}
            <AlertDialog open={!!deleteRecipient} onOpenChange={() => setDeleteRecipient(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Empfänger löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie den Empfänger "{deleteRecipient?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteRecipientMutation.mutate(deleteRecipient.id)}
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