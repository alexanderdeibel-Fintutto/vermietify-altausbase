import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, Filter, X, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export default function AccountTransactionsList({ transactions = [] }) {
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        type: 'all',
        dateFrom: '',
        dateTo: '',
        amountMin: '',
        amountMax: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = [...transactions];

        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.sender_receiver?.toLowerCase().includes(search) ||
                t.description?.toLowerCase().includes(search) ||
                t.reference?.toLowerCase().includes(search)
            );
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(t =>
                filters.status === 'categorized' ? t.is_categorized : !t.is_categorized
            );
        }

        // Type filter (income/expense)
        if (filters.type !== 'all') {
            filtered = filtered.filter(t =>
                filters.type === 'income' ? t.amount > 0 : t.amount < 0
            );
        }

        // Date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(t => t.transaction_date >= filters.dateFrom);
        }
        if (filters.dateTo) {
            filtered = filtered.filter(t => t.transaction_date <= filters.dateTo);
        }

        // Amount range filter
        if (filters.amountMin) {
            filtered = filtered.filter(t => Math.abs(t.amount) >= parseFloat(filters.amountMin));
        }
        if (filters.amountMax) {
            filtered = filtered.filter(t => Math.abs(t.amount) <= parseFloat(filters.amountMax));
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => {
            if (!a.transaction_date) return 1;
            if (!b.transaction_date) return -1;
            try {
                const dateA = parseISO(a.transaction_date);
                const dateB = parseISO(b.transaction_date);
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                return dateB.getTime() - dateA.getTime();
            } catch {
                return 0;
            }
        });
    }, [transactions, filters]);

    const hasActiveFilters = filters.search || filters.status !== 'all' || filters.type !== 'all' || 
                              filters.dateFrom || filters.dateTo || filters.amountMin || filters.amountMax;

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                Keine Transaktionen für dieses Konto vorhanden
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Controls */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Suche nach Empfänger, Beschreibung..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        {hasActiveFilters && <Badge className="bg-blue-500 ml-1 h-5 w-5 p-0 flex items-center justify-center">!</Badge>}
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters({
                                search: '',
                                status: 'all',
                                type: 'all',
                                dateFrom: '',
                                dateTo: '',
                                amountMin: '',
                                amountMax: ''
                            })}
                        >
                            <X className="w-4 h-4 mr-1" />
                            Zurücksetzen
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border">
                        <div>
                            <Label className="text-xs mb-1.5 block">Status</Label>
                            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle</SelectItem>
                                    <SelectItem value="categorized">Zugeordnet</SelectItem>
                                    <SelectItem value="uncategorized">Nicht zugeordnet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs mb-1.5 block">Art</Label>
                            <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle</SelectItem>
                                    <SelectItem value="income">Eingänge</SelectItem>
                                    <SelectItem value="expense">Ausgänge</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 col-span-2 md:col-span-1">
                            <div>
                                <Label className="text-xs mb-1.5 block">Betrag von</Label>
                                <Input
                                    type="number"
                                    placeholder="Min €"
                                    value={filters.amountMin}
                                    onChange={(e) => setFilters({...filters, amountMin: e.target.value})}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5 block">bis</Label>
                                <Input
                                    type="number"
                                    placeholder="Max €"
                                    value={filters.amountMax}
                                    onChange={(e) => setFilters({...filters, amountMax: e.target.value})}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs mb-1.5 block">Datum von</Label>
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                className="h-9"
                            />
                        </div>

                        <div>
                            <Label className="text-xs mb-1.5 block">Datum bis</Label>
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                className="h-9"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="text-sm text-slate-600">
                {filteredAndSortedTransactions.length} von {transactions.length} Transaktionen
            </div>

            {/* Transactions Table */}
            {filteredAndSortedTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    Keine Transaktionen gefunden
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Empfänger/Auftraggeber</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                                {transaction.transaction_date ? (() => {
                                    try {
                                        const date = parseISO(transaction.transaction_date);
                                        if (isNaN(date.getTime())) return transaction.transaction_date;
                                        return format(date, 'dd.MM.yyyy', { locale: de });
                                    } catch {
                                        return transaction.transaction_date;
                                    }
                                })() : '-'}
                            </TableCell>
                            <TableCell>
                                <div className="max-w-xs">
                                    <p className="font-medium text-slate-800 truncate">
                                        {transaction.sender_receiver || '-'}
                                    </p>
                                    {transaction.iban && (
                                        <p className="text-xs text-slate-500 font-mono truncate">
                                            {transaction.iban}
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="max-w-sm">
                                    <p className="text-sm text-slate-700 truncate">{transaction.description}</p>
                                    {transaction.reference && (
                                        <p className="text-xs text-slate-500 truncate mt-1">
                                            {transaction.reference}
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {transaction.amount > 0 ? (
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`font-semibold ${transaction.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {transaction.amount > 0 ? '+' : ''}€{transaction.amount?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {transaction.is_categorized ? (
                                    <Badge className="bg-emerald-100 text-emerald-700">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Kategorisiert
                                    </Badge>
                                ) : (
                                    <Badge className="bg-slate-100 text-slate-600">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Nicht zugeordnet
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
                </div>
            )}
        </div>
    );
}