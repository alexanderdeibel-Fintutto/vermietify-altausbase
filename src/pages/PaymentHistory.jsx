import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { CheckCircle, Search, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PaymentHistory() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.ActualPayment.list('-zahlungsdatum')
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const filteredPayments = payments.filter(p => {
        const tenant = tenants.find(t => t.id === p.tenant_id);
        const tenantName = tenant ? `${tenant.vorname} ${tenant.nachname}`.toLowerCase() : '';
        return tenantName.includes(searchTerm.toLowerCase());
    });

    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zahlungshistorie</h1>
                    <p className="vf-page-subtitle">{payments.length} Zahlungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{payments.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Zahlungen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{totalPaid.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(totalPaid / payments.length || 0).toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Zahlung</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Zahlungen durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            <div className="space-y-2">
                {filteredPayments.map((payment) => {
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
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(payment.zahlungsdatum).toLocaleDateString('de-DE')}
                                            </div>
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
                })}
            </div>
        </div>
    );
}