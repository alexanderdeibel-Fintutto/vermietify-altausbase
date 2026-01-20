import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, TrendingUp, TrendingDown, Euro } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BankingOverview() {
    const { data: accounts = [] } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: () => base44.entities.BankAccount.list()
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['bankTransactions'],
        queryFn: () => base44.entities.BankTransaction.list('-buchungsdatum', 50)
    });

    const totalBalance = transactions.reduce((sum, t) => sum + (parseFloat(t.betrag) || 0), 0);
    const income = transactions.filter(t => parseFloat(t.betrag) > 0).reduce((sum, t) => sum + parseFloat(t.betrag), 0);
    const expenses = Math.abs(transactions.filter(t => parseFloat(t.betrag) < 0).reduce((sum, t) => sum + parseFloat(t.betrag), 0));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Banking</h1>
                    <p className="vf-page-subtitle">{accounts.length} Konten • {transactions.length} Transaktionen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Landmark className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{accounts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Bankkonten</div>
                    </CardContent>
                </Card>

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

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{totalBalance.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Saldo</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Link to={createPageUrl('BankAccounts')}>
                    <Card className="vf-card-clickable h-full">
                        <CardContent className="p-8 text-center">
                            <Landmark className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                            <h3 className="text-xl font-semibold mb-2">Bankkonten</h3>
                            <p className="text-gray-600">{accounts.length} Konten verwalten</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to={createPageUrl('BankTransactions')}>
                    <Card className="vf-card-clickable h-full">
                        <CardContent className="p-8 text-center">
                            <Euro className="w-16 h-16 mx-auto mb-4 text-green-600" />
                            <h3 className="text-xl font-semibold mb-2">Transaktionen</h3>
                            <p className="text-gray-600">{transactions.length} Bewegungen</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}