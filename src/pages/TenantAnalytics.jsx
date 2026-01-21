import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function TenantAnalytics() {
    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const avgTenancyMonths = contracts.reduce((sum, c) => {
        const months = (new Date(c.mietende) - new Date(c.mietbeginn)) / (30*24*60*60*1000);
        return sum + months;
    }, 0) / (contracts.length || 1);

    const totalRent = contracts.reduce((sum, c) => sum + parseFloat(c.kaltmiete || 0), 0);

    const tenantsByType = [
        { name: 'Privat', value: tenants.filter(t => !t.firma).length },
        { name: 'Gewerblich', value: tenants.filter(t => t.firma).length }
    ];

    const COLORS = ['#3B82F6', '#10B981'];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieter-Analytics</h1>
                    <p className="vf-page-subtitle">Statistiken & Trends</p>
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
                            <Clock className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{avgTenancyMonths.toFixed(1)}</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Mietdauer (Monate)</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Mieteinnahmen/Monat</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{(totalRent / tenants.length || 0).toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Ø Miete/Mieter</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Mietertypen</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={tenantsByType}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label
                                >
                                    {tenantsByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Top Mieter nach Miethöhe</h3>
                        <div className="space-y-2">
                            {contracts.sort((a, b) => b.kaltmiete - a.kaltmiete).slice(0, 5).map(c => {
                                const tenant = tenants.find(t => t.id === c.tenant_id);
                                return (
                                    <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between">
                                            <div className="font-semibold text-sm">{tenant?.vorname} {tenant?.nachname}</div>
                                            <div className="font-bold">{c.kaltmiete.toLocaleString('de-DE')}€</div>
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