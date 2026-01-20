import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Badge } from '@/components/ui/badge';
import { Euro, CheckCircle, AlertCircle, Clock, Search } from 'lucide-react';

export default function PaymentTracking() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['actualPayments'],
        queryFn: () => base44.entities.ActualPayment.list('-zahlungsdatum', 100)
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const filteredPayments = payments.filter(payment => {
        if (!searchTerm) return true;
        const tenant = tenants.find(t => t.id === payment.tenant_id);
        const tenantName = tenant ? `${tenant.vorname} ${tenant.nachname}`.toLowerCase() : '';
        return tenantName.includes(searchTerm.toLowerCase());
    });

    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);
    const thisMonthPaid = payments
        .filter(p => new Date(p.zahlungsdatum).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zahlungsverfolgung</h1>
                    <p className="vf-page-subtitle">{payments.length} Zahlungen erfasst</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalPaid.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt eingegangen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-900">{thisMonthPaid.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Dieser Monat</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{payments.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Transaktionen</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Suche nach Mieter..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Payment List */}
            <div className="space-y-3">
                {filteredPayments.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            Keine Zahlungen gefunden
                        </CardContent>
                    </Card>
                ) : (
                    filteredPayments.map((payment) => {
                        const tenant = tenants.find(t => t.id === payment.tenant_id);
                        return (
                            <Card key={payment.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                            <div>
                                                <div className="font-semibold">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {new Date(payment.zahlungsdatum).toLocaleDateString('de-DE')}
                                                </div>
                                                {payment.verwendungszweck && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {payment.verwendungszweck}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-700">
                                                {parseFloat(payment.betrag).toLocaleString('de-DE')}€
                                            </div>
                                            <Badge className="vf-badge-success mt-1">Bezahlt</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}