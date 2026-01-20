import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DepositManagement() {
    const { data: deposits = [] } = useQuery({
        queryKey: ['deposits'],
        queryFn: () => base44.entities.Deposit.list('-created_date')
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const activeDeposits = deposits.filter(d => d.status === 'held');
    const returnedDeposits = deposits.filter(d => d.status === 'returned');
    const totalHeld = activeDeposits.reduce((sum, d) => sum + (parseFloat(d.betrag) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kautionsverwaltung</h1>
                    <p className="vf-page-subtitle">{deposits.length} Kautionen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Kaution
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Landmark className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{deposits.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Kautionen gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Landmark className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{activeDeposits.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktiv hinterlegt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{totalHeld.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Gesamt hinterlegt</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{returnedDeposits.length}</div>
                        <div className="text-sm opacity-90 mt-1">Zurückgegeben</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Kautionsübersicht</h3>
                    <div className="space-y-2">
                        {deposits.map((deposit) => {
                            const contract = contracts.find(c => c.id === deposit.contract_id);
                            const tenant = tenants.find(t => t.id === contract?.tenant_id);
                            return (
                                <div key={deposit.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{tenant?.vorname} {tenant?.nachname}</div>
                                            <div className="text-sm text-gray-600">{contract?.einheit}</div>
                                        </div>
                                        <Badge className={deposit.status === 'held' ? 'vf-badge-success' : 'vf-badge-default'}>
                                            {deposit.status === 'held' ? 'Hinterlegt' : 'Zurückgegeben'}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Betrag</div>
                                            <div className="font-semibold">{deposit.betrag.toLocaleString('de-DE')}€</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Hinterlegungsdatum</div>
                                            <div className="font-semibold text-xs">{new Date(deposit.hinterlegungsdatum).toLocaleDateString('de-DE')}</div>
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