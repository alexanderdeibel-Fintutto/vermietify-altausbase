import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AccountTransactionsList({ transactions = [] }) {
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => {
            if (!a.transaction_date) return 1;
            if (!b.transaction_date) return -1;
            const dateA = parseISO(a.transaction_date);
            const dateB = parseISO(b.transaction_date);
            return dateB - dateA;
        });
    }, [transactions]);

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                Keine Transaktionen für dieses Konto vorhanden
            </div>
        );
    }

    return (
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
                    {sortedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                                {transaction.transaction_date 
                                    ? format(parseISO(transaction.transaction_date), 'dd.MM.yyyy', { locale: de })
                                    : '-'
                                }
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
    );
}