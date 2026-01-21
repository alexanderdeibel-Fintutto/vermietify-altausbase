import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ResidentsManagement() {
    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list('-created_date')
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const activeTenants = tenants.filter(t => {
        const contract = contracts.find(c => c.tenant_id === t.id && new Date(c.mietende) > new Date());
        return !!contract;
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieterverwaltung</h1>
                    <p className="vf-page-subtitle">{activeTenants.length} aktive Mieter</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neuer Mieter
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{tenants.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Mieter gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{activeTenants.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Mieter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Phone className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">
                            {tenants.filter(t => t.telefon).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Mit Telefon</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{tenants.length}</div>
                        <div className="text-sm opacity-90 mt-1">Verwaltete Mieter</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Alle Mieter</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {tenants.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Keine Mieter vorhanden</p>
                        ) : (
                            tenants.map((tenant) => {
                                const contract = contracts.find(c => c.tenant_id === tenant.id);
                                const isActive = contract && new Date(contract.mietende) > new Date();
                                return (
                                    <div key={tenant.id} className="p-4 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold">
                                                    {tenant.vorname} {tenant.nachname}
                                                </div>
                                                <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                                                    {tenant.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {tenant.email}
                                                        </span>
                                                    )}
                                                    {tenant.telefon && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {tenant.telefon}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={isActive ? "success" : "default"}>
                                                {isActive ? "Aktiv" : "Inaktiv"}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}