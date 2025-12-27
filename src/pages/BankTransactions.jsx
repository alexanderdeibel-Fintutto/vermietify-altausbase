import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Receipt, Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function BankTransactions() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAccount, setFilterAccount] = useState('all');

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['bankTransactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date')
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: () => base44.entities.BankAccount.list()
    });

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = !searchTerm || 
            tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.sender_receiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.reference?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAccount = filterAccount === 'all' || tx.account_id === filterAccount;

        return matchesSearch && matchesAccount;
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
                    Banktransaktionen
                </h1>
                <p className="text-slate-500 mt-1">
                    {filteredTransactions.length} Buchungen
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Suche nach Buchungstext, Auftraggeber/Empfänger..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger className="w-full sm:w-64">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Konto filtern" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Konten</SelectItem>
                        {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">
                                    Buchungstag
                                </th>
                                <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">
                                    Auftraggeber/Empfänger
                                </th>
                                <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">
                                    Buchungstext
                                </th>
                                <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">
                                    IBAN
                                </th>
                                <th className="text-right text-xs font-medium text-slate-600 px-4 py-3">
                                    Betrag
                                </th>
                                <th className="text-center text-xs font-medium text-slate-600 px-4 py-3">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-12 text-center">
                                        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">
                                            {searchTerm || filterAccount !== 'all' 
                                                ? 'Keine Transaktionen gefunden' 
                                                : 'Noch keine Transaktionen'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const account = accounts.find(a => a.id === tx.account_id);
                                    const isPositive = tx.amount > 0;

                                    return (
                                        <tr key={tx.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                {tx.transaction_date || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-slate-800">
                                                    {tx.sender_receiver || '-'}
                                                </div>
                                                {account && (
                                                    <div className="text-xs text-slate-400">
                                                        {account.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-md">
                                                <div className="mb-1">
                                                    {tx.description || '-'}
                                                </div>
                                                {tx.reference && tx.reference !== tx.description && (
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        <span className="font-medium">Verwendungszweck:</span> {tx.reference}
                                                    </div>
                                                )}
                                                {tx.value_date && tx.value_date !== tx.transaction_date && (
                                                    <div className="text-xs text-slate-400 mt-0.5">
                                                        <span className="font-medium">Wertstellung:</span> {tx.value_date}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                                                {tx.iban || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className={cn(
                                                    "text-sm font-semibold",
                                                    isPositive ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {isPositive ? '+' : ''}{tx.amount?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {tx.is_matched ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                        Abgeglichen
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                        Offen
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}