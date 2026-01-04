import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Landmark, Plus, MoreVertical, Pencil, Trash2, Upload, TrendingUp, TrendingDown, Link2, RefreshCw, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import TransactionImport from '@/components/banking/TransactionImport';
import AccountTransactionsList from '@/components/banking/AccountTransactionsList';
import CashBookDialog from '@/components/banking/CashBookDialog';
import BankAccountDialog from '@/components/banking/BankAccountDialog';

function BankAccountForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: initialData || { is_primary: false, account_type: 'bank' }
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ is_primary: false, account_type: 'bank' });
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
                        <Label htmlFor="account_type">Kontotyp</Label>
                        <Select 
                            value={watch('account_type')} 
                            onValueChange={(value) => setValue('account_type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Typ wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bank">Bankkonto</SelectItem>
                                <SelectItem value="cash">Kasse</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {watch('account_type') === 'bank' && (
                        <>
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
                                    <Label htmlFor="iban">IBAN</Label>
                                    <Input 
                                        id="iban"
                                        {...register('iban')}
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
                        </>
                    )}

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
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importAccountId, setImportAccountId] = useState(null);
    const [expandedAccounts, setExpandedAccounts] = useState({});
    const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
    const [cashBookOpen, setCashBookOpen] = useState(false);
    const [selectedCashAccount, setSelectedCashAccount] = useState(null);
    const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
    const [selectedBankAccount, setSelectedBankAccount] = useState(null);
    const queryClient = useQueryClient();

    const toggleAccountExpanded = (accountId) => {
        setExpandedAccounts(prev => ({
            ...prev,
            [accountId]: prev[accountId] === true ? false : true
        }));
    };

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: () => base44.entities.BankAccount.list()
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['bankTransactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date', 1000),
        staleTime: 0
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

    const handleConnectBank = async () => {
        setIsConnecting(true);
        
        try {
            const response = await base44.functions.invoke('finapiConnect', {});

            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }

            if (response.data.success && response.data.webFormUrl) {
                // Open popup window
                const popup = window.open(
                    response.data.webFormUrl, 
                    'FinAPI', 
                    'width=800,height=700,scrollbars=yes'
                );

                // Poll for window close and refresh accounts
                const pollTimer = setInterval(() => {
                    if (popup && popup.closed) {
                        clearInterval(pollTimer);
                        queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
                        queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
                        toast.success('Bankkonten wurden aktualisiert');
                    }
                }, 500);

                // Cleanup after 5 minutes
                setTimeout(() => clearInterval(pollTimer), 300000);
            } else {
                toast.error('Bankverbindung konnte nicht initialisiert werden');
            }
        } catch (error) {
            console.error('Bank connection error:', error);
            toast.error(error.response?.data?.error || 'Fehler beim Verbinden der Bank');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSyncAccount = async (accountId) => {
        setIsSyncing(true);
        try {
            const response = await base44.functions.invoke('finapiSync', { accountId });
            
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
            
            toast.success(response.data.message);
        } catch (error) {
            console.error('Sync error:', error);
            toast.error(error.response?.data?.error || 'Synchronisierung fehlgeschlagen');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncAll = async () => {
        if (accounts.length === 0) {
            toast.error('Keine Bankkonten vorhanden');
            return;
        }

        setIsSyncing(true);
        
        try {
            const response = await base44.functions.invoke('finapiSync', {});
            
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
            
            toast.success(response.data.message);
        } catch (error) {
            console.error('Sync error:', error);
            toast.error(error.response?.data?.error || 'Synchronisierung fehlgeschlagen');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUndoImport = async (accountId) => {
        if (!confirm(`Möchten Sie den letzten CSV-Import für dieses Konto rückgängig machen?\n\nAlle Transaktionen aus dem letzten Import werden gelöscht.`)) {
            return;
        }

        const loadingToast = toast.loading('Lösche Import-Transaktionen...');

        try {
            const response = await base44.functions.invoke('undoLastImport', { accountId });
            
            toast.dismiss(loadingToast);
            
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            
            queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
            toast.success(response.data.message);
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Undo error:', error);
            toast.error('Fehler beim Rückgängig machen: ' + (error.message || 'Unbekannter Fehler'));
        }
    };

    const accountTransactionsMap = useMemo(() => {
        // Filter transactions by selected account
        let filteredTransactions = transactions;
        if (selectedAccountFilter !== 'all') {
            filteredTransactions = transactions.filter(t => t.account_id === selectedAccountFilter);
        }
        
        const map = new Map();
        filteredTransactions.forEach(t => {
            if (!map.has(t.account_id)) {
                map.set(t.account_id, []);
            }
            map.get(t.account_id).push(t);
        });
        
        // Sort transactions by date (newest first)
        map.forEach((txs) => {
            txs.sort((a, b) => {
                if (!a.transaction_date) return 1;
                if (!b.transaction_date) return -1;
                
                try {
                    // Try ISO format first (yyyy-MM-dd)
                    let dateA = parseISO(a.transaction_date);
                    let dateB = parseISO(b.transaction_date);
                    
                    // If invalid, try German format (dd.MM.yyyy)
                    if (isNaN(dateA.getTime())) {
                        const parts = a.transaction_date.split('.');
                        if (parts.length === 3) {
                            dateA = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    }
                    if (isNaN(dateB.getTime())) {
                        const parts = b.transaction_date.split('.');
                        if (parts.length === 3) {
                            dateB = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    }
                    
                    // Check for invalid dates
                    if (isNaN(dateA.getTime())) return 1;
                    if (isNaN(dateB.getTime())) return -1;
                    
                    return dateB.getTime() - dateA.getTime();
                } catch {
                    return 0;
                }
            });
        });
        
        return map;
    }, [transactions, selectedAccountFilter]);

    const accountStatsMap = useMemo(() => {
        const map = new Map();
        accountTransactionsMap.forEach((txs, accountId) => {
            const income = txs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const expenses = txs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            map.set(accountId, { income, expenses, count: txs.length });
        });
        return map;
    }, [accountTransactionsMap]);

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex-1">
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Bankkonten</h1>
                    <p className="text-slate-500 mt-1">{accounts.length} Konten verwalten</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={selectedAccountFilter} onValueChange={setSelectedAccountFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Konto wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Konten</SelectItem>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                    {acc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleSyncAll}
                        disabled={isSyncing || accounts.length === 0}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Alle synchronisieren
                    </Button>
                    <Button
                        onClick={handleConnectBank}
                        disabled={isConnecting}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Link2 className="w-4 h-4" />
                        Bank verbinden
                    </Button>
                    <Button 
                        onClick={() => {
                            setEditingAccount(null);
                            setFormOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Manuell hinzufügen
                    </Button>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Noch keine Bankkonten
                    </h3>
                    <p className="text-slate-500 mb-6">
                        Verbinden Sie Ihre Bank automatisch oder fügen Sie ein Konto manuell hinzu.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button 
                            onClick={handleConnectBank}
                            disabled={isConnecting}
                            className="bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                            <Link2 className="w-4 h-4" />
                            Bank verbinden
                        </Button>
                        <Button 
                            onClick={() => setFormOpen(true)}
                            variant="outline"
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Manuell hinzufügen
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {accounts.map((account) => {
                        const stats = accountStatsMap.get(account.id) || { income: 0, expenses: 0, count: 0 };
                        const accountTransactions = accountTransactionsMap.get(account.id) || [];
                        const isExpanded = expandedAccounts[account.id] === true;
                        const isCash = account.account_type === 'cash';
                        
                        return (
                            <Card 
                                key={account.id}
                                className="border-slate-200/50 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => {
                                    if (isCash) {
                                        setSelectedCashAccount(account);
                                        setCashBookOpen(true);
                                    } else {
                                        setSelectedBankAccount(account);
                                        setBankAccountDialogOpen(true);
                                    }
                                }}
                            >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">{account.name}</CardTitle>
                                                    {account.account_type === 'cash' && (
                                                       <Badge className="bg-amber-100 text-amber-700">
                                                           Kasse
                                                       </Badge>
                                                    )}
                                                    {account.is_primary && (
                                                       <Badge className="bg-emerald-100 text-emerald-700">
                                                           Hauptkonto
                                                       </Badge>
                                                    )}
                                                    {account.finapi_connection_id && (
                                                       <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                           <Link2 className="w-3 h-3 mr-1" />
                                                           Verbunden
                                                       </Badge>
                                                    )}
                                                </div>
                                                {account.bank_name && (
                                                    <p className="text-sm text-slate-500 mt-1">{account.bank_name}</p>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {account.finapi_connection_id && (
                                                        <DropdownMenuItem 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSyncAccount(account.id);
                                                            }}
                                                            disabled={isSyncing}
                                                        >
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            Synchronisieren
                                                        </DropdownMenuItem>
                                                    )}
                                                    {!isCash && (
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setImportAccountId(account.id);
                                                            setImportOpen(true);
                                                        }}>
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            CSV importieren
                                                        </DropdownMenuItem>
                                                    )}
                                                    {stats.count > 0 && !isCash && (
                                                        <DropdownMenuItem 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUndoImport(account.id);
                                                            }}
                                                            className="text-orange-600"
                                                        >
                                                            <Undo2 className="w-4 h-4 mr-2" />
                                                            Letzten Import rückgängig machen
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingAccount(account);
                                                        setFormOpen(true);
                                                    }}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Bearbeiten
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteAccount(account);
                                                        }}
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
                                            {account.account_type === 'bank' && account.iban && (
                                                <div>
                                                    <p className="text-sm text-slate-500">IBAN</p>
                                                    <p className="text-sm font-mono text-slate-700 mt-1">{account.iban}</p>
                                                </div>
                                            )}

                                            <div className="pt-4 border-t border-slate-100">
                                                <p className="text-sm text-slate-500 mb-2">Kontostand</p>
                                                <p className="text-3xl font-bold text-slate-800">
                                                    €{account.current_balance?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>

                                            {stats.count > 0 && !isCash && (
                                                <div className="pt-4 border-t border-slate-100">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-sm text-slate-500">Transaktionen</p>
                                                        <CollapsibleTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="gap-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {isExpanded ? (
                                                                    <>
                                                                        Ausblenden
                                                                        <ChevronUp className="w-4 h-4" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        Anzeigen ({stats.count})
                                                                        <ChevronDown className="w-4 h-4" />
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    </div>
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
                                                </div>
                                            )}
                                        </div>

                                        <CollapsibleContent>
                                            {stats.count > 0 && (
                                                <div className="mt-6 pt-6 border-t border-slate-200">
                                                    <AccountTransactionsList transactions={accountTransactions} />
                                                </div>
                                            )}
                                        </CollapsibleContent>
                                        </CardContent>
                                        </Card>
                                        );
                                        })}
                                        </div>
                                        )}

                                        <CashBookDialog
                                            open={cashBookOpen}
                                            onOpenChange={setCashBookOpen}
                                            account={selectedCashAccount}
                                            transactions={selectedCashAccount ? accountTransactionsMap.get(selectedCashAccount.id) || [] : []}
                                        />

                                        <BankAccountDialog
                                            open={bankAccountDialogOpen}
                                            onOpenChange={setBankAccountDialogOpen}
                                            account={selectedBankAccount}
                                            transactions={selectedBankAccount ? accountTransactionsMap.get(selectedBankAccount.id) || [] : []}
                                            onSync={() => selectedBankAccount && handleSyncAccount(selectedBankAccount.id)}
                                            onImport={() => {
                                                if (selectedBankAccount) {
                                                    setImportAccountId(selectedBankAccount.id);
                                                    setImportOpen(true);
                                                    setBankAccountDialogOpen(false);
                                                }
                                            }}
                                            isSyncing={isSyncing}
                                        />

                                        <BankAccountForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingAccount}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <TransactionImport
                open={importOpen}
                onOpenChange={setImportOpen}
                accountId={importAccountId}
                onSuccess={async () => {
                    console.log('Import success callback - refetching...');
                    await queryClient.resetQueries({ queryKey: ['bankTransactions'] });
                    await queryClient.refetchQueries({ queryKey: ['bankTransactions'], type: 'active' });
                    console.log('Refetch complete');
                }}
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