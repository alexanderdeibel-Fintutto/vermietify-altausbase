import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tag, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import CategoryForm from '@/components/banking/CategoryForm';

export default function TransactionCategories() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteCategory, setDeleteCategory] = useState(null);
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['transactionCategories'],
        queryFn: () => base44.entities.TransactionCategory.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.TransactionCategory.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactionCategories'] });
            setFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.TransactionCategory.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactionCategories'] });
            setFormOpen(false);
            setEditingCategory(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.TransactionCategory.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactionCategories'] });
            setDeleteCategory(null);
        }
    });

    const handleSubmit = (data) => {
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Transaktionskategorien"
                subtitle={`${categories.length} Kategorien verwalten`}
                action={() => {
                    setEditingCategory(null);
                    setFormOpen(true);
                }}
                actionLabel="Kategorie hinzufügen"
            />

            {categories.length === 0 ? (
                <EmptyState
                    icon={Tag}
                    title="Noch keine Kategorien"
                    description="Erstellen Sie Kategorien, um Ihre Transaktionen besser zu organisieren."
                    action={() => setFormOpen(true)}
                    actionLabel="Erste Kategorie erstellen"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <Card key={category.id} className="border-slate-200/50 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: category.color || '#64748b' }}
                                        >
                                            <Tag className="w-5 h-5 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                setEditingCategory(category);
                                                setFormOpen(true);
                                            }}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Bearbeiten
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => setDeleteCategory(category)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Löschen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {category.keywords && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2">Schlüsselwörter:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {category.keywords.split(',').map((keyword, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {keyword.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CategoryForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingCategory}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie die Kategorie "{deleteCategory?.name}" wirklich löschen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteCategory.id)}
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