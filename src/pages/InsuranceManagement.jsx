import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, DollarSign, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InsuranceManagement() {
    const { data: policies = [] } = useQuery({
        queryKey: ['insurancePolicies'],
        queryFn: () => base44.entities.InsurancePolicy.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const activePolicies = policies.filter(p => p.status === 'Aktiv');
    const expiringPolicies = policies.filter(p => {
        if (!p.vertragsende || p.status !== 'Aktiv') return false;
        const daysUntil = (new Date(p.vertragsende) - new Date()) / (24*60*60*1000);
        return daysUntil > 0 && daysUntil <= 90;
    });

    const totalPremiums = policies.reduce((sum, p) => sum + (parseFloat(p.jahresbeitrag) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Versicherungsmanagement</h1>
                    <p className="vf-page-subtitle">{policies.length} Versicherungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Shield className="w-4 h-4 mr-2" />
                        Neue Versicherung
                    </Button>
                </div>
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
                            <Shield className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{activePolicies.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktiv</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalPremiums.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Jahresbeiträge</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{expiringPolicies.length}</div>
                        <div className="text-sm opacity-90 mt-1">Laufen bald aus</div>
                    </CardContent>
                </Card>
            </div>

            {expiringPolicies.length > 0 && (
                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-orange-700">
                            <AlertCircle className="w-5 h-5" />
                            Bald auslaufende Versicherungen ({expiringPolicies.length})
                        </h3>
                        <div className="space-y-2">
                            {expiringPolicies.map((policy) => {
                                const building = buildings.find(b => b.id === policy.building_id);
                                const daysLeft = Math.ceil((new Date(policy.vertragsende) - new Date()) / (24*60*60*1000));
                                return (
                                    <div key={policy.id} className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold">{policy.versicherungsart}</div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {building?.name || 'Unbekannt'} • {policy.versicherer_name}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-orange-700 font-semibold">in {daysLeft} Tagen</div>
                                                <div className="text-xs text-gray-600">{new Date(policy.vertragsende).toLocaleDateString('de-DE')}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Alle Versicherungen</h3>
                    <div className="space-y-2">
                        {policies.map((policy) => {
                            const building = buildings.find(b => b.id === policy.building_id);
                            return (
                                <div key={policy.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{policy.versicherungsart}</div>
                                            <div className="text-sm text-gray-600">{building?.name || 'Unbekannt'}</div>
                                        </div>
                                        <Badge className={policy.status === 'Aktiv' ? 'vf-badge-success' : 'vf-badge-default'}>
                                            {policy.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <div className="text-xs text-gray-600">Versicherer</div>
                                            <div className="text-sm font-semibold">{policy.versicherer_name}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600">Jahresbeitrag</div>
                                            <div className="text-sm font-semibold">{policy.jahresbeitrag.toLocaleString('de-DE')}€</div>
                                        </div>
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