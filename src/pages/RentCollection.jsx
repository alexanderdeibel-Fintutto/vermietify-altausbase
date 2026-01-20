import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, CheckCircle, XCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RentCollection() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list('-created_date')
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const totalMonthlyRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const collectedThisMonth = payments.filter(p => {
        const paymentDate = new Date(p.created_date);
        const now = new Date();
        return paymentDate.getMonth() === now.getMonth() && p.status === 'paid';
    }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    const collectionRate = totalMonthlyRent > 0 ? (collectedThisMonth / totalMonthlyRent * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieteinzug</h1>
                    <p className="vf-page-subtitle">Übersicht & Status</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalMonthlyRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Soll-Miete/Monat</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{collectedThisMonth.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Eingegangen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{(totalMonthlyRent - collectedThisMonth).toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{collectionRate.toFixed(1)}%</div>
                        <div className="text-sm opacity-90 mt-1">Einzugsquote</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Mietzahlungen pro Mieter</h3>
                    <div className="space-y-2">
                        {contracts.map((contract) => {
                            const tenant = tenants.find(t => t.id === contract.tenant_id);
                            const tenantPayments = payments.filter(p => p.tenant_id === tenant?.id && p.status === 'paid');
                            const lastPayment = tenantPayments[0];
                            
                            return (
                                <div key={contract.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{tenant?.vorname} {tenant?.nachname}</div>
                                            <div className="text-sm text-gray-600">{contract.einheit}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{contract.kaltmiete.toLocaleString('de-DE')}€/Monat</div>
                                            <Badge className={lastPayment ? 'vf-badge-success' : 'vf-badge-warning'}>
                                                {lastPayment ? 'Bezahlt' : 'Ausstehend'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {lastPayment && (
                                        <div className="text-xs text-gray-600 mt-2">
                                            Letzte Zahlung: {new Date(lastPayment.created_date).toLocaleDateString('de-DE')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}