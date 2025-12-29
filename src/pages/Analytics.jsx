import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Building2, Euro, Home, Calendar } from 'lucide-react';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';

export default function Analytics() {
    const [timeRange, setTimeRange] = useState('12');

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

    const { data: financialItems = [], isLoading: loadingFinancialItems } = useQuery({
        queryKey: ['financial-items'],
        queryFn: () => base44.entities.FinancialItem.list()
    });

    const isLoading = loadingBuildings || loadingUnits || loadingContracts || loadingFinancialItems;

    // Monthly income trend
    const monthlyIncomeData = [];
    const months = parseInt(timeRange);
    for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const monthItems = financialItems.filter(f => 
            f.payment_month === monthKey && 
            f.type === 'receivable' && 
            f.category === 'rent' && 
            f.status === 'paid'
        );
        const income = monthItems.reduce((sum, f) => sum + (f.amount || 0), 0);
        monthlyIncomeData.push({
            month: format(date, 'MMM yy', { locale: de }),
            income: income
        });
    }

    // Income by building
    const buildingIncomeData = buildings.map(building => {
        const buildingUnits = units.filter(u => u.building_id === building.id);
        const buildingContracts = contracts.filter(c => 
            buildingUnits.some(u => u.id === c.unit_id) && c.status === 'active'
        );
        const monthlyIncome = buildingContracts.reduce((sum, c) => sum + (c.total_rent || 0), 0);
        
        return {
            name: building.name,
            income: monthlyIncome
        };
    }).sort((a, b) => b.income - a.income);

    // Occupancy rate per building
    const buildingOccupancyData = buildings.map(building => {
        const buildingUnits = units.filter(u => u.building_id === building.id);
        const occupiedUnits = buildingUnits.filter(u => u.status === 'occupied').length;
        const totalUnits = buildingUnits.length;
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
        
        return {
            name: building.name,
            rate: Math.round(occupancyRate),
            occupied: occupiedUnits,
            total: totalUnits
        };
    });

    // Financial item status distribution
    const rentItems = financialItems.filter(f => f.type === 'receivable' && f.category === 'rent');
    const itemStatusData = [
        { name: 'Bezahlt', value: rentItems.filter(f => f.status === 'paid').length, color: '#10b981' },
        { name: 'Ausstehend', value: rentItems.filter(f => f.status === 'pending').length, color: '#3b82f6' },
        { name: 'Überfällig', value: rentItems.filter(f => f.status === 'overdue').length, color: '#ef4444' },
        { name: 'Teilzahlung', value: rentItems.filter(f => f.status === 'partial').length, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    // Key metrics
    const totalRevenue = financialItems
        .filter(f => f.type === 'receivable' && f.category === 'rent' && f.status === 'paid')
        .reduce((sum, f) => sum + (f.amount || 0), 0);
    const expectedRevenue = contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.total_rent || 0), 0) * months;
    const collectionRate = expectedRevenue > 0 ? (totalRevenue / expectedRevenue) * 100 : 0;
    const avgRentPerUnit = units.length > 0 ? contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.total_rent || 0), 0) / units.length : 0;

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <PageHeader 
                    title="Auswertungen"
                    subtitle="Analysen und Statistiken Ihrer Immobilien"
                />
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-40">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="6">6 Monate</SelectItem>
                        <SelectItem value="12">12 Monate</SelectItem>
                        <SelectItem value="24">24 Monate</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Euro className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Gesamteinnahmen</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    €{totalRevenue.toLocaleString('de-DE')}
                                </p>
                                <p className="text-xs text-slate-400">Letzte {months} Monate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Einzugsquote</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {collectionRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-400">Zahlungsmoral</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Home className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Ø Miete pro Einheit</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    €{avgRentPerUnit.toFixed(0)}
                                </p>
                                <p className="text-xs text-slate-400">Pro Monat</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Portfoliowert</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    €{buildings.reduce((sum, b) => sum + (b.purchase_price || 0), 0).toLocaleString('de-DE')}
                                </p>
                                <p className="text-xs text-slate-400">{buildings.length} Immobilien</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Income Trend */}
                <Card className="border-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Mieteinnahmen Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyIncomeData}>
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
                                    <Line 
                                        type="monotone" 
                                        dataKey="income" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status */}
                <Card className="border-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Zahlungsstatus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 flex items-center justify-center">
                            {itemStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={itemStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={(entry) => `${entry.value}`}
                                        >
                                            {itemStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-slate-400">Keine Daten verfügbar</p>
                            )}
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {itemStatusData.map((item) => (
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

                {/* Income by Building */}
                <Card className="border-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Einnahmen pro Gebäude</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={buildingIncomeData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `€${v}`} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                                    <Tooltip 
                                        formatter={(value) => [`€${value.toLocaleString('de-DE')}/Monat`, 'Einnahmen']}
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar dataKey="income" fill="#10b981" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Occupancy by Building */}
                <Card className="border-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Auslastung pro Gebäude</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={buildingOccupancyData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                                    <Tooltip 
                                        formatter={(value, name, props) => [
                                            `${value}% (${props.payload.occupied}/${props.payload.total})`, 
                                            'Auslastung'
                                        ]}
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar dataKey="rate" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}