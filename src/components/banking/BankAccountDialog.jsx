import React from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, TrendingDown, Upload } from 'lucide-react';

export default function BankAccountDialog({ open, onOpenChange, account, transactions, onSync, onImport, isSyncing }) {
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

    // Calculate actual balance from transactions
    const actualBalance = sortedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const hasFinAPIConnection = account?.finapi_connection_id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl">{account?.name}</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-slate-500">{account?.bank_name}</p>
                                {account?.iban && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <p className="text-sm text-slate-500">{account.iban}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Aktueller Stand</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {actualBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
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

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {hasFinAPIConnection ? (
                            <Button 
                                onClick={onSync}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={isSyncing}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Synchronisiere...' : 'Von Bank aktualisieren'}
                            </Button>
                        ) : (
                            <Button 
                                onClick={onImport}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                CSV importieren
                            </Button>
                        )}
                    </div>

                    {/* Transactions List */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-3">
                            Alle Transaktionen ({sortedTransactions.length})
                        </h3>
                        {sortedTransactions.length === 0 ? (
                            <Card className="p-8 text-center">
                                <p className="text-slate-500">Noch keine Transaktionen vorhanden</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {hasFinAPIConnection 
                                        ? 'Klicken Sie auf "Von Bank aktualisieren", um Transaktionen zu laden'
                                        : 'Importieren Sie Transaktionen über CSV'}
                                </p>
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