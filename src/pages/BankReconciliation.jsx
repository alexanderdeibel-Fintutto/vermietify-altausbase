import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Landmark, RefreshCw, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import TransactionMatchCard from '@/components/banking/TransactionMatchCard';
import { 
    matchTransactionWithPayment, 
    unmatchTransaction, 
    findMatchingPayment,
    autoMatchAllTransactions 
} from '@/components/banking/matchTransactions';

export default function BankReconciliation() {
    const [isAutoMatching, setIsAutoMatching] = useState(false);
    const [importerOpen, setImporterOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
        queryKey: ['bank-transactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date')
    });

    const { data: payments = [], isLoading: loadingPayments } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const matchMutation = useMutation({
        mutationFn: ({ transactionId, paymentId }) => 
            matchTransactionWithPayment(transactionId, paymentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Transaktion erfolgreich abgeglichen');
        },
        onError: () => {
            toast.error('Fehler beim Abgleichen');
        }
    });

    const unmatchMutation = useMutation({
        mutationFn: (transactionId) => unmatchTransaction(transactionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Abgleich aufgehoben');
        },
        onError: () => {
            toast.error('Fehler beim Aufheben des Abgleichs');
        }
    });

    const handleAutoMatch = async () => {
        setIsAutoMatching(true);
        try {
            const count = await autoMatchAllTransactions();
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success(`${count} Transaktionen automatisch abgeglichen`);
        } catch (error) {
            toast.error('Fehler beim automatischen Abgleich');
        } finally {
            setIsAutoMatching(false);
        }
    };

    const unmatchedTransactions = transactions.filter(t => !t.is_matched && t.amount > 0);
    const matchedTransactions = transactions.filter(t => t.is_matched);
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'partial');

    // Calculate stats
    const totalUnmatched = unmatchedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalMatched = matchedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const openPayments = pendingPayments.reduce((sum, p) => sum + (p.expected_amount - (p.amount || 0)), 0);

    if (loadingTransactions || loadingPayments) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
                        Bankenabgleich
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gleichen Sie Transaktionen mit Zahlungen ab
                    </p>
                </div>
                <Button 
                    onClick={handleAutoMatch}
                    disabled={isAutoMatching || unmatchedTransactions.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {isAutoMatching ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Wird abgeglichen...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Auto-Abgleich
                        </>
                    )}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Nicht abgeglichen</p>
                            <p className="text-2xl font-bold text-slate-800">
                                €{totalUnmatched.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">{unmatchedTransactions.length} Transaktionen</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Abgeglichen</p>
                            <p className="text-2xl font-bold text-slate-800">
                                €{totalMatched.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">{matchedTransactions.length} Transaktionen</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Offene Forderungen</p>
                            <p className="text-2xl font-bold text-slate-800">
                                €{openPayments.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">{pendingPayments.length} Zahlungen</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="unmatched" className="space-y-6">
                <TabsList className="bg-white border border-slate-200">
                    <TabsTrigger value="unmatched">
                        Nicht abgeglichen ({unmatchedTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="matched">
                        Abgeglichen ({matchedTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Offene Zahlungen ({pendingPayments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="unmatched" className="space-y-4">
                    {unmatchedTransactions.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Alle Transaktionen abgeglichen
                            </h3>
                            <p className="text-slate-500">
                                Es gibt keine offenen Transaktionen zum Abgleichen.
                            </p>
                        </div>
                    ) : (
                        unmatchedTransactions.map(transaction => {
                            const match = findMatchingPayment(transaction, pendingPayments);
                            return (
                                <TransactionMatchCard
                                    key={transaction.id}
                                    transaction={transaction}
                                    suggestedPayment={match?.payment}
                                    matchScore={match?.score}
                                    availablePayments={pendingPayments}
                                    onMatch={(transactionId, paymentId) => 
                                        matchMutation.mutate({ transactionId, paymentId })
                                    }
                                    onUnmatch={() => {}}
                                    tenants={tenants}
                                    units={units}
                                    buildings={buildings}
                                />
                            );
                        })
                    )}
                </TabsContent>

                <TabsContent value="matched" className="space-y-4">
                    {matchedTransactions.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <Landmark className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Noch keine abgeglichenen Transaktionen
                            </h3>
                            <p className="text-slate-500">
                                Abgeglichene Transaktionen werden hier angezeigt.
                            </p>
                        </div>
                    ) : (
                        matchedTransactions.map(transaction => (
                            <TransactionMatchCard
                                key={transaction.id}
                                transaction={transaction}
                                availablePayments={[]}
                                onMatch={() => {}}
                                onUnmatch={(transactionId) => unmatchMutation.mutate(transactionId)}
                                tenants={tenants}
                                units={units}
                                buildings={buildings}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">Mieter</th>
                                        <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">Wohnung</th>
                                        <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">Monat</th>
                                        <th className="text-left text-xs font-medium text-slate-600 px-4 py-3">Fällig</th>
                                        <th className="text-right text-xs font-medium text-slate-600 px-4 py-3">Offen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingPayments.map(payment => {
                                        const tenant = tenants.find(t => t.id === payment.tenant_id);
                                        const unit = units.find(u => u.id === payment.unit_id);
                                        const building = unit ? buildings.find(b => b.id === unit.building_id) : null;
                                        const openAmount = payment.expected_amount - (payment.amount || 0);

                                        return (
                                            <tr key={payment.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                                    {tenant ? `${tenant.first_name} ${tenant.last_name}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {building && unit ? `${building.name} - ${unit.unit_number}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {payment.payment_month}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {payment.payment_date}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                                                    €{openAmount.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}