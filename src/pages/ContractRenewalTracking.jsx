import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ContractRenewalTracking() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const now = new Date();
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    const expiringContracts = contracts.filter(c => {
        if (!c.vertragsende) return false;
        const endDate = new Date(c.vertragsende);
        return endDate > now && endDate <= sixMonthsFromNow;
    });

    const criticalContracts = expiringContracts.filter(c => new Date(c.vertragsende) <= threeMonthsFromNow);
    const warningContracts = expiringContracts.filter(c => new Date(c.vertragsende) > threeMonthsFromNow);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Vertragsverlängerungen</h1>
                    <p className="vf-page-subtitle">{expiringContracts.length} auslaufende Verträge</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{criticalContracts.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Dringend (3 Monate)</div>
                    </CardContent>
                </Card>

                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <RefreshCw className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{warningContracts.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Bald (6 Monate)</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{expiringContracts.length}</div>
                        <div className="text-sm opacity-90 mt-1">Gesamt</div>
                    </CardContent>
                </Card>
            </div>

            {criticalContracts.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Dringend: Läuft in 3 Monaten aus
                        </h3>
                        <div className="space-y-3">
                            {criticalContracts.map((contract) => {
                                const tenant = tenants.find(t => t.id === contract.tenant_id);
                                const daysLeft = Math.floor((new Date(contract.vertragsende) - now) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={contract.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold mb-1">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </div>
                                                <div className="text-sm text-gray-700">
                                                    Endet: {new Date(contract.vertragsende).toLocaleDateString('de-DE')}
                                                </div>
                                                <div className="text-xs text-red-700 font-semibold mt-1">
                                                    Noch {daysLeft} Tage
                                                </div>
                                            </div>
                                            <Button size="sm" className="vf-btn-gradient">
                                                Verlängern
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {warningContracts.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-orange-600" />
                            Läuft in 6 Monaten aus
                        </h3>
                        <div className="space-y-3">
                            {warningContracts.map((contract) => {
                                const tenant = tenants.find(t => t.id === contract.tenant_id);
                                const daysLeft = Math.floor((new Date(contract.vertragsende) - now) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={contract.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold mb-1">
                                                    {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                                </div>
                                                <div className="text-sm text-gray-700">
                                                    Endet: {new Date(contract.vertragsende).toLocaleDateString('de-DE')}
                                                </div>
                                                <div className="text-xs text-orange-700 font-semibold mt-1">
                                                    Noch {daysLeft} Tage
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline">
                                                Verlängern
                                            </Button>
                                        </div>
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