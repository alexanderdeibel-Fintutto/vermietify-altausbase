import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, TrendingUp, TrendingDown, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CashBookDialog({ open, onOpenChange, account, transactions }) {
    const [showForm, setShowForm] = useState(false);
    const { register, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            transaction_date: format(new Date(), 'yyyy-MM-dd'),
            amount: '',
            description: '',
            sender_receiver: '',
            reference: ''
        }
    });
    const queryClient = useQueryClient();

    const createTransactionMutation = useMutation({
        mutationFn: async (data) => {
            // Create transaction
            const transaction = await base44.entities.BankTransaction.create(data);
            
            // Update account balance
            const newBalance = (account.current_balance || 0) + data.amount;
            await base44.entities.BankAccount.update(account.id, {
                current_balance: newBalance
            });
            
            return transaction;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            setShowForm(false);
            reset();
            toast.success('Kassenbuchung hinzugefügt');
        }
    });

    const handleFormSubmit = (data) => {
        createTransactionMutation.mutate({
            account_id: account.id,
            transaction_date: data.transaction_date,
            value_date: data.transaction_date,
            amount: parseFloat(data.amount),
            description: data.description,
            sender_receiver: data.sender_receiver || null,
            reference: data.reference || null,
            is_categorized: false
        });
    };

    const amount = watch('amount');
    const isIncome = amount && parseFloat(amount) > 0;

    const sortedTransactions = [...(transactions || [])].sort((a, b) => {
        try {
            if (!a.transaction_date || !b.transaction_date) return 0;
            const dateA = parseISO(a.transaction_date);
            const dateB = parseISO(b.transaction_date);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB.getTime() - dateA.getTime();
        } catch {
            return 0;
        }
    });

    const stats = sortedTransactions.reduce((acc, t) => {
        if (t.amount > 0) {
            acc.income += t.amount;
        } else {
            acc.expenses += Math.abs(t.amount);
        }
        return acc;
    }, { income: 0, expenses: 0 });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl">{account?.name}</DialogTitle>
                            <p className="text-sm text-slate-500 mt-1">Kassenbuchungen</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Aktueller Stand</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {account?.current_balance?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Einnahmen</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {stats.income.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Ausgaben</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {stats.expenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Add Transaction Form */}
                    {showForm ? (
                        <Card className="p-4 border-2 border-emerald-200 bg-emerald-50/50">
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-800">Neue Buchung</h3>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            setShowForm(false);
                                            reset();
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="transaction_date">Datum *</Label>
                                        <Input 
                                            id="transaction_date"
                                            type="date"
                                            {...register('transaction_date', { required: true })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="amount">
                                            Betrag (€) * 
                                            {amount && (
                                                <span className={`ml-2 text-xs ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {isIncome ? '→ Einnahme' : '→ Ausgabe'}
                                                </span>
                                            )}
                                        </Label>
                                        <Input 
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            {...register('amount', { required: true })}
                                            placeholder="100.00 (positiv) oder -50.00 (negativ)"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="description">Beschreibung *</Label>
                                        <Input 
                                            id="description"
                                            {...register('description', { required: true })}
                                            placeholder="z.B. Barverkauf, Portokasse"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="sender_receiver">Von/An</Label>
                                        <Input 
                                            id="sender_receiver"
                                            {...register('sender_receiver')}
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="reference">Verwendungszweck</Label>
                                        <Input 
                                            id="reference"
                                            {...register('reference')}
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => {
                                            setShowForm(false);
                                            reset();
                                        }}
                                    >
                                        Abbrechen
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        disabled={createTransactionMutation.isPending}
                                    >
                                        {createTransactionMutation.isPending && (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        )}
                                        Buchen
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    ) : (
                        <Button 
                            onClick={() => setShowForm(true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Neue Buchung hinzufügen
                        </Button>
                    )}

                    {/* Transactions List */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-3">
                            Alle Buchungen ({sortedTransactions.length})
                        </h3>
                        {sortedTransactions.length === 0 ? (
                            <Card className="p-8 text-center">
                                <p className="text-slate-500">Noch keine Buchungen vorhanden</p>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {sortedTransactions.map((transaction) => (
                                    <Card key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-slate-800">
                                                        {transaction.description}
                                                    </p>
                                                    {transaction.is_categorized && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Zugeordnet
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                    {transaction.transaction_date && (
                                                        <span>
                                                            {(() => {
                                                                try {
                                                                    const date = parseISO(transaction.transaction_date);
                                                                    return isNaN(date.getTime()) ? transaction.transaction_date : format(date, 'dd.MM.yyyy', { locale: de });
                                                                } catch {
                                                                    return transaction.transaction_date;
                                                                }
                                                            })()}
                                                        </span>
                                                    )}
                                                    {transaction.sender_receiver && (
                                                        <span>• {transaction.sender_receiver}</span>
                                                    )}
                                                    {transaction.reference && (
                                                        <span>• {transaction.reference}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`text-lg font-bold ${transaction.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {transaction.amount > 0 ? '+' : ''}
                                                {transaction.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}