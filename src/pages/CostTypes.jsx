import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
import { Plus, Search, MoreVertical, Pencil, Trash2, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import CostTypeForm from '@/components/cost-types/CostTypeForm';

export default function CostTypes() {
    const queryClient = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [editingCostType, setEditingCostType] = useState(null);
    const [deleteCostType, setDeleteCostType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [mainCategoryFilter, setMainCategoryFilter] = useState('all');

    const { data: costTypes = [], isLoading } = useQuery({
        queryKey: ['cost-types'],
        queryFn: () => base44.entities.CostType.list()
    });

    const { data: euerCategories = [] } = useQuery({
        queryKey: ['euer-categories'],
        queryFn: () => base44.entities.EuerCategory.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.CostType.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cost-types'] });
            setFormOpen(false);
            toast.success('Kostenart erstellt');
        },
        onError: (error) => {
            toast.error('Fehler beim Erstellen');
            console.error(error);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.CostType.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cost-types'] });
            setFormOpen(false);
            setEditingCostType(null);
            toast.success('Kostenart aktualisiert');
        },
        onError: (error) => {
            toast.error('Fehler beim Aktualisieren');
            console.error(error);
        }
    });

    const deleteMutation = useMutation({
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

    const handleSubmit = (data) => {
        if (editingCostType) {
            updateMutation.mutate({ id: editingCostType.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    // Get unique main categories
    const mainCategories = useMemo(() => {
        const categories = new Set(costTypes.map(ct => ct.main_category));
        return Array.from(categories).sort();
    }, [costTypes]);

    // Filter cost types
    const filteredCostTypes = useMemo(() => {
        let filtered = costTypes;

        if (typeFilter !== 'all') {
            filtered = filtered.filter(ct => ct.type === typeFilter);
        }

        if (mainCategoryFilter !== 'all') {
            filtered = filtered.filter(ct => ct.main_category === mainCategoryFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
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
    }, [costTypes, typeFilter, mainCategoryFilter, searchTerm]);

    // Calculate statistics
    const stats = useMemo(() => {
        const expenses = costTypes.filter(ct => ct.type === 'expense').length;
        const income = costTypes.filter(ct => ct.type === 'income').length;
        const distributable = costTypes.filter(ct => ct.distributable).length;
        const taxDeductible = costTypes.filter(ct => ct.tax_deductible).length;

        return { expenses, income, distributable, taxDeductible };
    }, [costTypes]);

    const getEuerCategory = (id) => {
        return euerCategories.find(ec => ec.id === id);
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
                        Kostenarten
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {filteredCostTypes.length} {filteredCostTypes.length === 1 ? 'Kostenart' : 'Kostenarten'}
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setEditingCostType(null);
                        setFormOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Neue Kostenart
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Ausgaben</p>
                                <p className="text-2xl font-bold text-red-600">{stats.expenses}</p>
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
                                <p className="text-2xl font-bold text-emerald-600">{stats.income}</p>
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
                                <p className="text-2xl font-bold text-blue-600">{stats.distributable}</p>
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
                                <p className="text-2xl font-bold text-purple-600">{stats.taxDeductible}</p>
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

            {/* Table */}
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
                                                                setFormOpen(true);
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

            {/* Form Dialog */}
            <CostTypeForm
                open={formOpen}
                onOpenChange={setFormOpen}
                costType={editingCostType}
                euerCategories={euerCategories}
                onSuccess={handleSubmit}
            />

            {/* Delete Dialog */}
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
                            onClick={() => deleteMutation.mutate(deleteCostType.id)}
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