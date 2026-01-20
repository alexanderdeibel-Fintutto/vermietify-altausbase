import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Euro } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RentPaymentDashboard() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.ActualPayment.list('-zahlungsdatum', 100)
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthPayments = payments.filter(p => {
        const date = new Date(p.zahlungsdatum);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const paidTenantIds = thisMonthPayments.map(p => p.tenant_id);
    const unpaidContracts = contracts.filter(c => !paidTenantIds.includes(c.tenant_id));
    const paidContracts = contracts.filter(c => paidTenantIds.includes(c.tenant_id));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mietzahlungen</h1>
                    <p className="vf-page-subtitle">Aktueller Monat: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-green-300 bg-green-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{paidContracts.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Bezahlt</div>
                    </CardContent>
                </Card>

                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{unpaidContracts.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">
                            {((paidContracts.length / contracts.length) * 100 || 0).toFixed(0)}%
                        </div>
                        <div className="text-sm opacity-90 mt-1">Zahlungsquote</div>
                    </CardContent>
                </Card>
            </div>

            {/* Unpaid List */}
            {unpaidContracts.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            Ausstehende Zahlungen
                        </h3>
                        <div className="space-y-3">
                            {unpaidContracts.map((contract) => {
                                const tenant = tenants.find(t => t.id === contract.tenant_id);
                                const amount = (parseFloat(contract.kaltmiete) || 0) + (parseFloat(contract.betriebskosten_vorauszahlung) || 0);
                                return (
                                    <div key={contract.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-6 h-6 text-orange-600" />
                                            <div>
                                                <div className="font-semibold">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </div>
                                                <div className="text-sm text-gray-600">Miete ausstehend</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-orange-700">{amount.toLocaleString('de-DE')}€</div>
                                            <Badge className="vf-badge-warning mt-1">Ausstehend</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Paid List */}
            {paidContracts.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Bezahlte Mieten
                        </h3>
                        <div className="space-y-3">
                            {paidContracts.map((contract) => {
                                const tenant = tenants.find(t => t.id === contract.tenant_id);
                                const payment = thisMonthPayments.find(p => p.tenant_id === contract.tenant_id);
                                return (
                                    <div key={contract.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                            <div>
                                                <div className="font-semibold">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {payment && new Date(payment.zahlungsdatum).toLocaleDateString('de-DE')}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="vf-badge-success">Bezahlt</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}