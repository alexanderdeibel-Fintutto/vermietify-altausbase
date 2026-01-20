import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Users, DollarSign, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const occupiedUnits = contracts.map(c => c.unit_id);
    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const paymentRate = (completedPayments / (payments.length || 1)) * 100;

    const quickActions = [
        { title: 'Neue Miete', icon: Users, color: 'bg-blue-100 text-blue-600', link: 'TenantAnalytics' },
        { title: 'Zahlung tracking', icon: DollarSign, color: 'bg-green-100 text-green-600', link: 'PaymentManagement' },
        { title: 'Dokument', icon: FileText, color: 'bg-purple-100 text-purple-600', link: 'DocumentManagement' },
        { title: 'Bericht', icon: TrendingUp, color: 'bg-orange-100 text-orange-600', link: 'ReportBuilder' }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Dashboard</h1>
                    <p className="vf-page-subtitle">Willkommen zu deiner Immobilienverwaltung</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Home className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gebäude</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{contracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Mieter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Monatliche Miete</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{paymentRate.toFixed(0)}%</div>
                        <div className="text-sm opacity-90 mt-1">Zahlungsquote</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Schnellaktionen</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((action, idx) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={idx} to={createPageUrl(action.link)}>
                                        <button className={`w-full p-4 rounded-lg ${action.color} flex flex-col items-center gap-2 hover:shadow-md transition`}>
                                            <Icon className="w-6 h-6" />
                                            <span className="text-xs font-semibold text-center">{action.title}</span>
                                        </button>
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Übersicht</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Einheiten</span>
                                <span className="font-semibold">{units.length} (davon {occupiedUnits.length} vermietet)</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Auslastung</span>
                                <span className="font-semibold">{((occupiedUnits.length / units.length) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">Eingegangene Zahlungen</span>
                                <span className="font-semibold">{completedPayments}/{payments.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-orange-900">Überfällige Zahlungen</h3>
                            <p className="text-sm text-orange-800 mt-1">Es gibt {payments.filter(p => p.status === 'pending').length} ausstehende Zahlungen</p>
                            <Link to={createPageUrl('PaymentManagement')}>
                                <Button size="sm" className="mt-3 bg-orange-600 hover:bg-orange-700 text-white">
                                    Alle Zahlungen anzeigen
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}