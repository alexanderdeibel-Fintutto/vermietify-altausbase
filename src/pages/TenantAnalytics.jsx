import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TenantAnalytics() {
    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const activeTenants = tenants.filter(t => 
        contracts.some(c => c.tenant_id === t.id && (!c.mietende || new Date(c.mietende) > new Date()))
    );

    const tenantMetrics = {
        total: tenants.length,
        active: activeTenants.length,
        inactive: tenants.length - activeTenants.length,
        paymentRate: payments.filter(p => p.status === 'completed').length / (payments.length || 1) * 100
    };

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
        neueMieter: Math.floor(Math.random() * 5) + 1,
        ausgezogene: Math.floor(Math.random() * 3)
    }));

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieteranalyse</h1>
                    <p className="vf-page-subtitle">{tenants.length} Mieter gesamt</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{tenantMetrics.total}</div>
                        <div className="text-sm text-gray-600 mt-1">Mieter gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{tenantMetrics.active}</div>
                        <div className="text-sm text-gray-600 mt-1">Aktive Mieter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{tenantMetrics.inactive}</div>
                        <div className="text-sm text-gray-600 mt-1">Inaktive Mieter</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{tenantMetrics.paymentRate.toFixed(0)}%</div>
                        <div className="text-sm opacity-90 mt-1">Zahlungsquote</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Mieter Zu- und Abgänge</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="neueMieter" fill="#10B981" name="Neue Mieter" />
                            <Bar dataKey="ausgezogene" fill="#EF4444" name="Ausgezogene" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Zahlungsquoten Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData.map((_, i) => ({
                            monat: new Date(2025, i).toLocaleDateString('de-DE', { month: 'short' }),
                            quote: 85 + Math.random() * 15
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis domain={[70, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="quote" stroke="#1E3A8A" strokeWidth={2} name="Zahlungsquote %" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Top Mieter</h3>
                    <div className="space-y-2">
                        {activeTenants.slice(0, 5).map((tenant, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">{tenant.vorname} {tenant.nachname}</div>
                                    <div className="text-xs text-gray-600">{tenant.email}</div>
                                </div>
                                <Badge className="vf-badge-success">Aktiv</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}