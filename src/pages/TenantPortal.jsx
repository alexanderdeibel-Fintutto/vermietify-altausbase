import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Wrench, Mail, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TenantPortal() {
    const { data: tenant } = useQuery({
        queryKey: ['currentTenant'],
        queryFn: () => base44.auth.me()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.GeneratedDocument.list()
    });

    const tenantContracts = contracts.slice(0, 1);
    const tenantPayments = payments.slice(0, 5);
    const pendingPayments = tenantPayments.filter(p => p.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mein Mietportal</h1>
                    <p className="vf-page-subtitle">Verwalte deine Miete und Dokumente</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{tenantContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Verträge</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{pendingPayments.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Zahlungen ausstehend</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Wrench className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">2</div>
                        <div className="text-sm text-gray-600 mt-1">Wartungsanfragen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{documents.length}</div>
                        <div className="text-sm opacity-90 mt-1">Dokumente</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Meine Verträge</h3>
                        <div className="space-y-3">
                            {tenantContracts.map((contract) => (
                                <div key={contract.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold">{contract.einheit}</div>
                                        <Badge className="vf-badge-success">Aktiv</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Miete</div>
                                            <div className="font-semibold">{contract.kaltmiete.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Beginn</div>
                                            <div className="font-semibold">{new Date(contract.mietbeginn).toLocaleDateString('de-DE')}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Zahlungshistorie</h3>
                        <div className="space-y-2">
                            {tenantPayments.map((payment) => (
                                <div key={payment.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-sm">{payment.amount.toLocaleString('de-DE')}€</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {new Date(payment.created_date).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <Badge className={payment.status === 'paid' ? 'vf-badge-success' : 'vf-badge-warning'}>
                                        {payment.status === 'paid' ? 'Bezahlt' : 'Ausstehend'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Meine Dokumente</h3>
                    <div className="space-y-2">
                        {documents.slice(0, 5).map((doc) => (
                            <div key={doc.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-sm">{doc.titel}</div>
                                    <div className="text-xs text-gray-600 mt-1">{doc.dokumenttyp}</div>
                                </div>
                                <Button size="sm" variant="outline">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}