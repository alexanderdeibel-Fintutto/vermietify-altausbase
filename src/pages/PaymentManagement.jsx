import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PaymentManagement() {
    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list('-created_date')
    });

    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalPaid = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zahlungsverwaltung</h1>
                    <p className="vf-page-subtitle">{payments.length} Zahlungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{payments.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt-Zahlungen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalPaid.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Bezahlt</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{totalPending.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{paidPayments.length}</div>
                        <div className="text-sm opacity-90 mt-1">Erledigte Zahlungen</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Letzte Zahlungen</h3>
                    <div className="space-y-2">
                        {payments.slice(0, 15).map(payment => (
                            <div key={payment.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{payment.description || 'Zahlung'}</div>
                                        <div className="text-sm text-gray-600">{new Date(payment.created_date).toLocaleDateString('de-DE')}</div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div className="font-bold">{parseFloat(payment.amount || 0).toLocaleString('de-DE')}€</div>
                                        <Badge className={payment.status === 'paid' ? 'vf-badge-success' : 'vf-badge-warning'}>
                                            {payment.status === 'paid' ? 'Bezahlt' : 'Ausstehend'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}