import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function PartnerStats({ connectedAccountId }) {
    const { data: account } = useQuery({
        queryKey: ['connectedAccount', connectedAccountId],
        queryFn: async () => {
            const accounts = await base44.entities.StripeConnectedAccount.filter({ id: connectedAccountId });
            return accounts[0];
        },
        enabled: !!connectedAccountId,
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['partnerTransactions', connectedAccountId],
        queryFn: () => base44.entities.MarketplaceTransaction.filter({ 
            connected_account_id: connectedAccountId,
            status: 'COMPLETED',
        }),
        enabled: !!connectedAccountId,
    });

    if (!account) return null;

    const thisMonthTransactions = transactions.filter(t => {
        const date = new Date(t.created_date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const thisMonthVolume = thisMonthTransactions.reduce((sum, t) => sum + t.net_amount, 0);
    const avgTransactionValue = transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.net_amount, 0) / transactions.length 
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Gesamtumsatz</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                €{((account.total_volume || 0) / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Dieser Monat</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                €{(thisMonthVolume / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Ø Auftragswert</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                €{(avgTransactionValue / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}