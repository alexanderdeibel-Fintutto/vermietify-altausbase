import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionList({ connectedAccountId }) {
    const [refunding, setRefunding] = useState(null);

    const { data: transactions = [], refetch } = useQuery({
        queryKey: ['transactions', connectedAccountId],
        queryFn: async () => {
            if (connectedAccountId) {
                return await base44.entities.MarketplaceTransaction.filter({ 
                    connected_account_id: connectedAccountId 
                }, '-created_date');
            }
            return await base44.entities.MarketplaceTransaction.list('-created_date', 20);
        },
    });

    const handleRefund = async (transactionId) => {
        if (!window.confirm('Transaktion wirklich erstatten? Transfer wird rückgängig gemacht.')) return;

        setRefunding(transactionId);
        try {
            await base44.functions.invoke('refundMarketplacePayment', {
                transaction_id: transactionId,
                reverse_transfer: true,
            });

            toast.success('Rückerstattung erfolgreich');
            refetch();
        } catch (error) {
            toast.error('Fehler: ' + error.message);
        } finally {
            setRefunding(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Transaktionen</span>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <p className="text-center py-8 text-slate-600">Keine Transaktionen vorhanden</p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="border rounded-lg p-4 hover:bg-slate-50">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                tx.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                tx.status === 'REFUNDED' ? 'bg-orange-100 text-orange-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {tx.status}
                                            </span>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                                {tx.transaction_type}
                                            </span>
                                        </div>
                                        <p className="font-medium text-slate-900">{tx.description}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(tx.created_date).toLocaleString('de-DE')}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900">
                                            €{(tx.total_amount / 100).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            Netto: €{(tx.net_amount / 100).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-green-600">
                                            Fee: €{(tx.application_fee / 100).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {tx.customer_email && (
                                    <p className="text-xs text-slate-500 mb-2">Kunde: {tx.customer_email}</p>
                                )}

                                {tx.status === 'COMPLETED' && tx.refunded_at === null && (
                                    <Button
                                        onClick={() => handleRefund(tx.id)}
                                        disabled={refunding === tx.id}
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        {refunding === tx.id ? 'Wird erstattet...' : 'Erstatten'}
                                    </Button>
                                )}

                                {tx.refunded_at && (
                                    <p className="text-xs text-orange-600 mt-2">
                                        Erstattet: {new Date(tx.refunded_at).toLocaleString('de-DE')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}