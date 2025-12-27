import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Landmark, Plus, MoreVertical, Pencil, Trash2, Upload, TrendingUp, TrendingDown, Globe, Lock } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import TransactionImporter from '@/components/banking/TransactionImporter.jsx';
import OnlineBankingSetup from '@/components/banking/OnlineBankingSetup.jsx';
import OnlineBankingSync from '@/components/banking/OnlineBankingSync.jsx';

function BankAccountForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: initialData || { is_primary: false }
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ is_primary: false });
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            current_balance: data.current_balance ? parseFloat(data.current_balance) : 0,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Bankkonto bearbeiten' : 'Neues Bankkonto hinzufügen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Kontobezeichnung *</Label>
                        <Input 
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Mietkonto"
                        />
                    </div>

                    <div>
                        <Label htmlFor="bank_name">Bank</Label>
                        <Input 
                            id="bank_name"
                            {...register('bank_name')}
                            placeholder="z.B. Sparkasse"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="iban">IBAN *</Label>
                            <Input 
                                id="iban"
                                {...register('iban', { required: true })}
                                placeholder="DE89370400440532013000"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bic">BIC</Label>
                            <Input 
                                id="bic"
                                {...register('bic')}
                                placeholder="COBADEFFXXX"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="current_balance">Aktueller Kontostand (€)</Label>
                        <Input 
                            id="current_balance"
                            type="number"
                            step="0.01"
                            {...register('current_balance')}
                            placeholder="10000.00"
                        />
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <Label htmlFor="is_primary">Hauptkonto</Label>
                        <Switch 
                            id="is_primary"
                            checked={watch('is_primary')}
                            onCheckedChange={(checked) => setValue('is_primary', checked)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Speichern' : 'Hinzufügen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function BankAccounts() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [deleteAccount, setDeleteAccount] = useState(null);
    const [importerOpen, setImporterOpen] = useState(false);
    const [onlineBankingSetup, setOnlineBankingSetup] = useState(null);
    const queryClient = useQueryClient();

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: () => base44.entities.BankAccount.list()
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['bankTransactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date', 100)
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.BankAccount.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            setFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.BankAccount.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            setFormOpen(false);
            setEditingAccount(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.BankAccount.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            setDeleteAccount(null);
        }
    });

    const handleSubmit = (data) => {
        if (editingAccount) {
            updateMutation.mutate({ id: editingAccount.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const getAccountTransactions = (accountId) => {
        return transactions.filter(t => t.account_id === accountId);
    };

    const getTransactionStats = (accountId) => {
        const accountTx = getAccountTransactions(accountId);
        const income = accountTx.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = accountTx.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return { income, expenses, count: accountTx.length };
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Bankkonten</h1>
                    <p className="text-slate-500 mt-1">{accounts.length} Konten verwalten</p>
                </div>
                <div className="flex items-center gap-3">
                    {accounts.length > 0 && (
                        <Button 
                            variant="outline"
                            onClick={() => setImporterOpen(true)}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Transaktionen importieren
                        </Button>
                    )}
                    <Button 
                        onClick={() => {
                            setEditingAccount(null);
                            setFormOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Konto hinzufügen
                    </Button>
                </div>
            </div>

            {accounts.length === 0 ? (
                <EmptyState
                    icon={Landmark}
                    title="Noch keine Bankkonten"
                    description="Fügen Sie Ihr erstes Bankkonto hinzu, um Transaktionen zu verwalten."
                    action={() => setFormOpen(true)}
                    actionLabel="Erstes Konto hinzufügen"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {accounts.map((account) => {
                        const stats = getTransactionStats(account.id);
                        
                        return (
                            <Card key={account.id} className="border-slate-200/50 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg">{account.name}</CardTitle>
                                                {account.is_primary && (
                                                    <Badge className="bg-emerald-100 text-emerald-700">
                                                        Hauptkonto
                                                    </Badge>
                                                )}
                                                {account.online_banking_enabled && (
                                                    <Badge className="bg-blue-100 text-blue-700">
                                                        <Globe className="w-3 h-3 mr-1" />
                                                        Online
                                                    </Badge>
                                                )}
                                            </div>
                                            {account.bank_name && (
                                                <p className="text-sm text-slate-500 mt-1">{account.bank_name}</p>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingAccount(account);
                                                    setFormOpen(true);
                                                }}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Bearbeiten
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setOnlineBankingSetup(account)}>
                                                    <Globe className="w-4 h-4 mr-2" />
                                                    Online-Banking
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => setDeleteAccount(account)}
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
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-slate-500">IBAN</p>
                                            <p className="text-sm font-mono text-slate-700 mt-1">{account.iban}</p>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-sm text-slate-500 mb-2">Kontostand</p>
                                            <p className="text-3xl font-bold text-slate-800">
                                                €{account.current_balance?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>

                                        {account.online_banking_enabled && (
                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm text-slate-500">Online-Banking</p>
                                                    {account.last_sync_date && (
                                                        <p className="text-xs text-slate-400">
                                                            Zuletzt: {new Date(account.last_sync_date).toLocaleDateString('de-DE')}
                                                        </p>
                                                    )}
                                                </div>
                                                <OnlineBankingSync 
                                                    account={account}
                                                    onSyncComplete={() => {}}
                                                />
                                            </div>
                                        )}

                                        {stats.count > 0 && (
                                            <div className="pt-4 border-t border-slate-100">
                                                <p className="text-sm text-slate-500 mb-3">Transaktionen</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500">Eingänge</p>
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                €{stats.income.toLocaleString('de-DE')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500">Ausgänge</p>
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                €{stats.expenses.toLocaleString('de-DE')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-3">
                                                    {stats.count} Transaktionen gesamt
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <BankAccountForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingAccount}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <TransactionImporter
                open={importerOpen}
                onOpenChange={setImporterOpen}
                accounts={accounts}
            />

            <OnlineBankingSetup
                open={!!onlineBankingSetup}
                onOpenChange={() => setOnlineBankingSetup(null)}
                account={onlineBankingSetup}
            />

            <AlertDialog open={!!deleteAccount} onOpenChange={() => setDeleteAccount(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bankkonto löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie das Konto "{deleteAccount?.name}" wirklich löschen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteAccount.id)}
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