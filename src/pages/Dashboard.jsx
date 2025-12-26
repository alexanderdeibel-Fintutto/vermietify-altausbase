import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, FileText, CreditCard, AlertCircle, TrendingUp, Home, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
    const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [], isLoading: loadingUnits } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: contracts = [], isLoading: loadingContracts } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: payments = [], isLoading: loadingPayments } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const isLoading = loadingBuildings || loadingUnits || loadingContracts || loadingPayments;

    // Calculate statistics
    const activeContracts = contracts.filter(c => c.status === 'active');
    const occupiedUnits = units.filter(u => u.status === 'occupied').length;
    const vacantUnits = units.filter(u => u.status === 'vacant').length;
    const totalUnits = units.length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Monthly rent income
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthPayments = payments.filter(p => p.payment_month === currentMonth && p.status === 'paid');
    const monthlyIncome = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Expected vs received
    const expectedMonthlyRent = activeContracts.reduce((sum, c) => sum + (c.total_rent || 0), 0);
    
    // Overdue payments
    const overduePayments = payments.filter(p => p.status === 'overdue' || p.status === 'pending');
    const overdueAmount = overduePayments.reduce((sum, p) => sum + ((p.expected_amount || 0) - (p.amount || 0)), 0);

    // Monthly income chart data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = format(date, 'yyyy-MM');
        const monthPayments = payments.filter(p => p.payment_month === monthKey && p.status === 'paid');
        const income = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        monthlyData.push({
            month: format(date, 'MMM', { locale: de }),
            income: income
        });
    }

    // Unit status distribution
    const statusData = [
        { name: 'Vermietet', value: occupiedUnits, color: '#10b981' },
        { name: 'Leer', value: vacantUnits, color: '#f59e0b' },
        { name: 'Renovierung', value: units.filter(u => u.status === 'renovation').length, color: '#6366f1' }
    ].filter(d => d.value > 0);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-36 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-1">Übersicht Ihrer Immobilien</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Gebäude"
                    value={buildings.length}
                    subtitle={`${totalUnits} Wohneinheiten`}
                    icon={Building2}
                />
                <StatCard
                    title="Auslastung"
                    value={`${occupancyRate}%`}
                    subtitle={`${occupiedUnits} von ${totalUnits} vermietet`}
                    icon={Home}
                    trend={vacantUnits > 0 ? `${vacantUnits} leer` : null}
                    trendUp={vacantUnits === 0}
                />
                <StatCard
                    title="Mieteinnahmen"
                    value={`€${monthlyIncome.toLocaleString('de-DE')}`}
                    subtitle={format(new Date(), 'MMMM yyyy', { locale: de })}
                    icon={TrendingUp}
                    trend={expectedMonthlyRent > 0 ? `von €${expectedMonthlyRent.toLocaleString('de-DE')} erwartet` : null}
                    trendUp={monthlyIncome >= expectedMonthlyRent}
                />
                <StatCard
                    title="Offene Zahlungen"
                    value={overduePayments.length}
                    subtitle={overdueAmount > 0 ? `€${overdueAmount.toLocaleString('de-DE')} ausstehend` : 'Alle Zahlungen erhalten'}
                    icon={AlertCircle}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Income Chart */}
                <Card className="lg:col-span-2 border-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Mieteinnahmen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `€${v}`} />
                                    <Tooltip 
                                        formatter={(value) => [`€${value.toLocaleString('de-DE')}`, 'Einnahmen']}
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card className="border-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Wohnungsstatus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    Keine Wohnungen vorhanden
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {statusData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to={createPageUrl('Buildings')}>
                    <Card className="border-slate-200/50 hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                    <Building2 className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Gebäude verwalten</h3>
                                    <p className="text-sm text-slate-500">{buildings.length} Gebäude</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link to={createPageUrl('Payments')}>
                    <Card className="border-slate-200/50 hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Zahlungen prüfen</h3>
                                    <p className="text-sm text-slate-500">{overduePayments.length} offen</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link to={createPageUrl('Analytics')}>
                    <Card className="border-slate-200/50 hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <BarChart3 className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Auswertungen</h3>
                                    <p className="text-sm text-slate-500">Analysen & Reports</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}