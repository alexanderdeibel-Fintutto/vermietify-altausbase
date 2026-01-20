import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TenantHistory() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list('-vertragsbeginn')
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: terminations = [] } = useQuery({
        queryKey: ['terminations'],
        queryFn: () => base44.entities.ContractTermination.list()
    });

    const activeContracts = contracts.filter(c => !c.vertragsende || new Date(c.vertragsende) > new Date());
    const endedContracts = contracts.filter(c => c.vertragsende && new Date(c.vertragsende) <= new Date());

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieterhistorie</h1>
                    <p className="vf-page-subtitle">{tenants.length} Mieter gesamt</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{tenants.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt</div>
                    </CardContent>
                </Card>

                <Card className="border-green-300 bg-green-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{activeContracts.length}</div>
                        <div className="text-sm text-gray-700 mt-1">Aktiv</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="text-3xl font-bold">{endedContracts.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Beendet</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold">{terminations.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Kündigungen</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Aktuelle Mieter
                        </h3>
                        <div className="space-y-2">
                            {activeContracts.slice(0, 5).map((contract) => {
                                const tenant = tenants.find(t => t.id === contract.tenant_id);
                                return (
                                    <div key={contract.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="font-semibold">
                                            {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Seit {new Date(contract.vertragsbeginn).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            Ehemalige Mieter
                        </h3>
                        <div className="space-y-2">
                            {endedContracts.slice(0, 5).map((contract) => {
                                const tenant = tenants.find(t => t.id === contract.tenant_id);
                                return (
                                    <div key={contract.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="font-semibold">
                                            {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Bis {new Date(contract.vertragsende).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}