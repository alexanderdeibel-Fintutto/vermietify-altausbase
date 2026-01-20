import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PaymentTracking() {
    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list('-created_date')
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalReceived = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const month = new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' });
        return {
            monat: month,
            erhalten: 15000 + Math.random() * 5000,
            ausstehend: 2000 + Math.random() * 1000
        };
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zahlungsverfolgung</h1>
                    <p className="vf-page-subtitle">{payments.length} Zahlungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{payments.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Zahlungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalReceived.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Erhalten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{totalPending.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {((completedPayments.length / payments.length) * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm opacity-90 mt-1">Zahlungsquote</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Zahlungsentwicklung</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="erhalten" fill="#10B981" name="Erhalten" />
                            <Bar dataKey="ausstehend" fill="#F97316" name="Ausstehend" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 text-orange-700">Ausstehende Zahlungen</h3>
                        <div className="space-y-2">
                            {pendingPayments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="p-3 bg-white rounded-lg border border-orange-200">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">{payment.amount.toLocaleString('de-DE')}€</div>
                                        <Badge className="vf-badge-warning">Ausstehend</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-300 bg-green-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 text-green-700">Erhaltene Zahlungen</h3>
                        <div className="space-y-2">
                            {completedPayments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="p-3 bg-white rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">{payment.amount.toLocaleString('de-DE')}€</div>
                                        <Badge className="vf-badge-success">Bezahlt</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}