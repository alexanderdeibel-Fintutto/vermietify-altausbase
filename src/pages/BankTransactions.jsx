import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, TrendingDown, Euro } from 'lucide-react';

export default function BankTransactions() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['bankTransactions'],
        queryFn: () => base44.entities.BankTransaction.list('-buchungsdatum', 100)
    });

    const filteredTransactions = transactions.filter(t =>
        t.verwendungszweck?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.empfaenger_zahler?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const income = transactions.filter(t => parseFloat(t.betrag) > 0).reduce((sum, t) => sum + parseFloat(t.betrag), 0);
    const expenses = Math.abs(transactions.filter(t => parseFloat(t.betrag) < 0).reduce((sum, t) => sum + parseFloat(t.betrag), 0));

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Banktransaktionen</h1>
                    <p className="vf-page-subtitle">{transactions.length} Transaktionen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{income.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Eingänge</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{expenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausgänge</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Transaktionen durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            <div className="space-y-2">
                {filteredTransactions.map((transaction) => {
                    const amount = parseFloat(transaction.betrag);
                    const isIncome = amount > 0;

                    return (
                        <Card key={transaction.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {isIncome ? (
                                            <TrendingUp className="w-8 h-8 text-green-600" />
                                        ) : (
                                            <TrendingDown className="w-8 h-8 text-red-600" />
                                        )}
                                        <div>
                                            <div className="font-semibold">{transaction.empfaenger_zahler || 'Unbekannt'}</div>
                                            <div className="text-sm text-gray-600">{transaction.verwendungszweck}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(transaction.buchungsdatum).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                                            {isIncome ? '+' : ''}{amount.toLocaleString('de-DE')}€
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}