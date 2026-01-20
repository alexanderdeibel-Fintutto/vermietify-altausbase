import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Download, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ContractManagement() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['leaseContracts'],
        queryFn: () => base44.entities.LeaseContract.list('-mietbeginn')
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const activeContracts = contracts.filter(c => {
        const end = new Date(c.mietende);
        return end > new Date();
    });

    const expiringContracts = activeContracts.filter(c => {
        const daysUntil = (new Date(c.mietende) - new Date()) / (24*60*60*1000);
        return daysUntil > 0 && daysUntil <= 90;
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Vertragsverwaltung</h1>
                    <p className="vf-page-subtitle">{contracts.length} Mietverträge</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neuer Vertrag
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{contracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Verträge</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{activeContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktiv</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{expiringContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Laufen bald aus</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0).toLocaleString('de-DE')}€
                        </div>
                        <div className="text-sm opacity-90 mt-1">Gesamtmiete/Monat</div>
                    </CardContent>
                </Card>
            </div>

            {expiringContracts.length > 0 && (
                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-orange-700">
                            <AlertCircle className="w-5 h-5" />
                            Verträge laufen bald aus ({expiringContracts.length})
                        </h3>
                        <div className="space-y-2">
                            {expiringContracts.map((contract) => {
                                const tenant = tenants.find(t => t.id === contract.tenant_id);
                                const daysLeft = Math.ceil((new Date(contract.mietende) - new Date()) / (24*60*60*1000));
                                return (
                                    <div key={contract.id} className="p-3 bg-white rounded-lg border border-orange-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold">{contract.einheit}</div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {tenant?.vorname} {tenant?.nachname}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-orange-700 font-semibold">in {daysLeft} Tagen</div>
                                                <div className="text-xs text-gray-600">{new Date(contract.mietende).toLocaleDateString('de-DE')}</div>
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
                    <h3 className="font-semibold text-lg mb-4">Alle Verträge</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {contracts.map((contract) => {
                            const tenant = tenants.find(t => t.id === contract.tenant_id);
                            const isActive = new Date(contract.mietende) > new Date();
                            return (
                                <div key={contract.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{contract.einheit}</div>
                                            <div className="text-sm text-gray-600">
                                                {tenant?.vorname} {tenant?.nachname}
                                            </div>
                                        </div>
                                        <Badge className={isActive ? 'vf-badge-success' : 'vf-badge-default'}>
                                            {isActive ? 'Aktiv' : 'Beendet'}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Miete</div>
                                            <div className="font-semibold">{contract.kaltmiete.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Laufzeit</div>
                                            <div className="font-semibold text-xs">{new Date(contract.mietbeginn).toLocaleDateString('de-DE')} - {new Date(contract.mietende).toLocaleDateString('de-DE')}</div>
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