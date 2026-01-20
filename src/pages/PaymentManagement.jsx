import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PaymentManagement() {
    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list('-created_date')
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const pendingPayments = payments.filter(p => p.status === 'pending');
    const completedPayments = payments.filter(p => p.status === 'completed');
    const overduePayments = payments.filter(p => {
        if (p.status !== 'pending' || !p.due_date) return false;
        return new Date(p.due_date) < new Date();
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const collectRate = completedPayments.length / (payments.length || 1) * 100;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zahlungsmanagement</h1>
                    <p className="vf-page-subtitle">{payments.length} Zahlungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CreditCard className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Sollmiete/Monat</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{collectRate.toFixed(0)}%</div>
                        <div className="text-sm text-gray-600 mt-1">Eingangquote</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold">{pendingPayments.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{overduePayments.length}</div>
                        <div className="text-sm opacity-90 mt-1">Überfällig</div>
                    </CardContent>
                </Card>
            </div>

            {overduePayments.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            Überfällige Zahlungen ({overduePayments.length})
                        </h3>
                        <div className="space-y-2">
                            {overduePayments.map((payment) => (
                                <div key={payment.id} className="p-3 bg-white rounded-lg border border-red-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold">{payment.betrag}€</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Fällig: {new Date(payment.due_date).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="destructive">Mahnung</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Eingegangene Zahlungen</h3>
                        <div className="space-y-2">
                            {completedPayments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div>
                                        <div className="font-semibold text-green-700">{payment.betrag}€</div>
                                        <div className="text-xs text-gray-600">
                                            {new Date(payment.created_date).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <Badge className="vf-badge-success">Bezahlt</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Ausstehende Zahlungen</h3>
                        <div className="space-y-2">
                            {pendingPayments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div>
                                        <div className="font-semibold text-orange-700">{payment.betrag}€</div>
                                        <div className="text-xs text-gray-600">
                                            Fällig: {new Date(payment.due_date).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <Badge className="vf-badge-warning">Ausstehend</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}