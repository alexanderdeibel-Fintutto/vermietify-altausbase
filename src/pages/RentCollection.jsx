import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Euro, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

export default function RentCollection() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['actualPayments'],
        queryFn: () => base44.entities.ActualPayment.list('-zahlungsdatum', 100)
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const expectedRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0) + (parseFloat(c.betriebskosten_vorauszahlung) || 0), 0);
    
    const thisMonthPayments = payments.filter(p => {
        const paymentDate = new Date(p.zahlungsdatum);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    const receivedRent = thisMonthPayments.reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);
    const collectionRate = expectedRent > 0 ? (receivedRent / expectedRent) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieteingang</h1>
                    <p className="vf-page-subtitle">Übersicht aktueller Monat</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-900">{expectedRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Erwartete Miete</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{receivedRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Eingegangen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{(expectedRent - receivedRent).toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{collectionRate.toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Eingangsquote</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tenant Payment Status */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="font-semibold text-lg mb-4">Zahlungsstatus nach Mieter</h2>
                    <div className="space-y-3">
                        {contracts.map((contract) => {
                            const tenant = tenants.find(t => t.id === contract.tenant_id);
                            const expectedAmount = (parseFloat(contract.kaltmiete) || 0) + (parseFloat(contract.betriebskosten_vorauszahlung) || 0);
                            const tenantPayment = thisMonthPayments.find(p => p.tenant_id === contract.tenant_id);
                            const hasPaid = !!tenantPayment;

                            return (
                                <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        {hasPaid ? (
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                        ) : (
                                            <Clock className="w-8 h-8 text-orange-600" />
                                        )}
                                        <div>
                                            <div className="font-semibold">
                                                {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Soll: {expectedAmount.toLocaleString('de-DE')}€
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={hasPaid ? 'vf-badge-success' : 'vf-badge-warning'}>
                                            {hasPaid ? 'Bezahlt' : 'Ausstehend'}
                                        </Badge>
                                        {tenantPayment && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(tenantPayment.zahlungsdatum).toLocaleDateString('de-DE')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}