import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Euro, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'];

export default function Finanzen() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.ActualPayment.list()
    });

    const totalRent = contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
    const totalExpenses = invoices.reduce((sum, inv) => sum + (parseFloat(inv.betrag) || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.betrag) || 0), 0);
    const balance = totalRent - totalExpenses;

    const expenseCategories = [
        { name: 'Reparaturen', value: totalExpenses * 0.35 },
        { name: 'Versicherungen', value: totalExpenses * 0.25 },
        { name: 'Verwaltung', value: totalExpenses * 0.20 },
        { name: 'Nebenkosten', value: totalExpenses * 0.15 },
        { name: 'Sonstiges', value: totalExpenses * 0.05 }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Finanzen</h1>
                    <p className="vf-page-subtitle">Finanzübersicht & Analysen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{totalRent.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Mieteinnahmen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ausgaben</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Receipt className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-700">{totalPayments.toLocaleString('de-DE')}€</div>
                        <div className="text-sm text-gray-600 mt-1">Zahlungseingänge</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Euro className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{balance.toLocaleString('de-DE')}€</div>
                        <div className="text-sm opacity-90 mt-1">Saldo</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Ausgaben nach Kategorie</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={expenseCategories}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expenseCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value.toFixed(0)}€`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Schnellberichte</h3>
                        <div className="space-y-3">
                            <Link to={createPageUrl('FinancialReporting')}>
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold">Jahresabschluss</div>
                                            <div className="text-sm text-gray-600">Gesamtübersicht 2025</div>
                                        </div>
                                        <Download className="w-5 h-5 text-blue-700" />
                                    </div>
                                </div>
                            </Link>
                            <Link to={createPageUrl('RentCollection')}>
                                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold">Mietenübersicht</div>
                                            <div className="text-sm text-gray-600">Aktuelle Periode</div>
                                        </div>
                                        <Download className="w-5 h-5 text-green-700" />
                                    </div>
                                </div>
                            </Link>
                            <Link to={createPageUrl('PropertyTaxOverview')}>
                                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-colors cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold">Steuerbericht</div>
                                            <div className="text-sm text-gray-600">Anlage V Übersicht</div>
                                        </div>
                                        <Download className="w-5 h-5 text-purple-700" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}