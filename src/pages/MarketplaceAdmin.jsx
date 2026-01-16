import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function MarketplaceAdmin() {
    const { data: accounts = [] } = useQuery({
        queryKey: ['connectedAccounts'],
        queryFn: () => base44.entities.StripeConnectedAccount.list('-created_date'),
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['marketplaceTransactions'],
        queryFn: () => base44.entities.MarketplaceTransaction.list('-created_date', 50),
    });

    const activeAccounts = accounts.filter(a => a.account_status === 'ACTIVE');
    const totalVolume = accounts.reduce((sum, a) => sum + (a.total_volume || 0), 0);
    const totalFees = accounts.reduce((sum, a) => sum + (a.total_fees_collected || 0), 0);
    const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Marktplatz-Administration</h1>
                    <p className="text-slate-600">Stripe Connect Partner-Verwaltung</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Aktive Partner</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{activeAccounts.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Gesamtumsatz</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">
                                        €{(totalVolume / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Provisionen</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">
                                        €{(totalFees / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Transaktionen</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{completedTransactions.length}</p>
                                </div>
                                <Activity className="w-8 h-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Partner List */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Partner-Übersicht</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {accounts.length === 0 ? (
                            <p className="text-center py-8 text-slate-600">Noch keine Partner</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                                            <th className="text-left py-3 px-4 font-medium text-slate-700">Typ</th>
                                            <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                                            <th className="text-right py-3 px-4 font-medium text-slate-700">Umsatz</th>
                                            <th className="text-right py-3 px-4 font-medium text-slate-700">Provisionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((account) => (
                                            <tr key={account.id} className="border-b hover:bg-slate-50">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{account.business_name}</p>
                                                        <p className="text-xs text-slate-500">{account.email}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                                        {account.partner_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        account.account_status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                        account.account_status === 'ONBOARDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-slate-100 text-slate-800'
                                                    }`}>
                                                        {account.account_status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium">
                                                    €{((account.total_volume || 0) / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-green-600">
                                                    €{((account.total_fees_collected || 0) / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aktuelle Transaktionen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <p className="text-center py-8 text-slate-600">Noch keine Transaktionen</p>
                        ) : (
                            <div className="space-y-3">
                                {transactions.slice(0, 10).map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 text-sm">{tx.description}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(tx.created_date).toLocaleString('de-DE')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">
                                                €{(tx.total_amount / 100).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-green-600">
                                                Fee: €{(tx.application_fee / 100).toFixed(2)}
                                            </p>
                                        </div>
                                        <span className={`ml-4 px-2 py-1 rounded text-xs font-medium ${
                                            tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            tx.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}