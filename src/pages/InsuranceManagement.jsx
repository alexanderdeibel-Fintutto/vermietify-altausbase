import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InsuranceManagement() {
    const policies = [
        { id: 1, name: 'Wohngebäudeversicherung', type: 'Wohngeb.', insurer: 'Allianz', premium: 1200, start: '2024-01-01', end: '2025-01-01', status: 'active' },
        { id: 2, name: 'Haftpflichtversicherung', type: 'Haftpfl.', insurer: 'AXA', premium: 300, start: '2024-06-01', end: '2026-06-01', status: 'active' },
        { id: 3, name: 'Mietausfallversicherung', type: 'Mietausfall', insurer: 'Generali', premium: 450, start: '2023-01-01', end: '2025-12-31', status: 'expires_soon' },
    ];

    const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);
    const activeCount = policies.filter(p => p.status === 'active').length;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Versicherungsverwaltung</h1>
                    <p className="vf-page-subtitle">{policies.length} Versicherungen verwaltet</p>
                </div>
                <Button className="vf-btn-gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Versicherung
                </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{policies.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Versicherungen</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{activeCount}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktiv</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{totalPremium.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresprämien</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(totalPremium / 12).toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Monatlich</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Versicherungspolizien</h3>
                    <div className="space-y-2">
                        {policies.map(policy => (
                            <div key={policy.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="font-semibold">{policy.name}</div>
                                        <div className="text-sm text-gray-600">{policy.insurer}</div>
                                    </div>
                                    <Badge className={
                                        policy.status === 'active' ? 'vf-badge-success' :
                                        policy.status === 'expires_soon' ? 'vf-badge-warning' :
                                        'vf-badge-default'
                                    }>
                                        {policy.status === 'active' ? 'Aktiv' : 'Läuft bald aus'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                                    <div>
                                        <div className="text-gray-600">Prämie/Jahr</div>
                                        <div className="font-semibold">{policy.premium.toLocaleString('de-DE')}€</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Gültig bis</div>
                                        <div className="font-semibold">{new Date(policy.end).toLocaleDateString('de-DE')}</div>
                                    </div>
                                    <div className="text-right">
                                        <Button size="sm" variant="outline">Bearbeiten</Button>
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