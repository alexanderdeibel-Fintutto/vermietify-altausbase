import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, User, Euro } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DepositManagement() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const totalDeposits = contracts.reduce((sum, c) => sum + (parseFloat(c.kaution) || 0), 0);
    const activeDeposits = contracts.filter(c => !c.vertragsende || new Date(c.vertragsende) > new Date());

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kautionsverwaltung</h1>
                    <p className="vf-page-subtitle">{activeDeposits.length} aktive Kautionen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Landmark className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{activeDeposits.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Kautionen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{totalDeposits.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Gesamt Kautionen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-700">
                            {(totalDeposits / activeDeposits.length || 0).toFixed(0)}€
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Ø Kaution</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-3">
                {activeDeposits.map((contract) => {
                    const tenant = tenants.find(t => t.id === contract.tenant_id);
                    const deposit = parseFloat(contract.kaution) || 0;

                    return (
                        <Card key={contract.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold">
                                            {tenant?.vorname?.charAt(0) || 'M'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">
                                                {tenant ? `${tenant.vorname} ${tenant.nachname}` : 'Unbekannt'}
                                            </h3>
                                            <div className="text-sm text-gray-600">
                                                Vertragsbeginn: {new Date(contract.vertragsbeginn).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-700">{deposit.toLocaleString('de-DE')}€</div>
                                        <Badge className="vf-badge-success mt-1">Hinterlegt</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}