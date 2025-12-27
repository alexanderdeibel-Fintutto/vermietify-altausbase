import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Building2, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import PageHeader from '@/components/shared/PageHeader';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#64748b'];

export default function FinancialReports() {
    const [dateRange, setDateRange] = useState('3m'); // 1m, 3m, 6m, 12m, all
    const [selectedAccount, setSelectedAccount] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
        queryKey: ['bankTransactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date', 1000)
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: () => base44.entities.BankAccount.list()
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['transactionCategories'],
        queryFn: () => base44.entities.TransactionCategory.list()
    });

    const { data: payments = [] } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    // Calculate date range
    const dateFilter = useMemo(() => {
        const now = new Date();
        if (dateRange === 'all') return null;
        
        const months = parseInt(dateRange);
        return {
            start: startOfMonth(subMonths(now, months)),
            end: endOfMonth(now)
        };
    }, [dateRange]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        if (dateFilter) {
            filtered = filtered.filter(t => 
                isWithinInterval(parseISO(t.transaction_date), dateFilter)
            );
        }

        if (selectedAccount !== 'all') {
            filtered = filtered.filter(t => t.account_id === selectedAccount);
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category_id === selectedCategory);
        }

        return filtered;
    }, [transactions, dateFilter, selectedAccount, selectedCategory]);

    // Category breakdown
    const categoryBreakdown = useMemo(() => {
        const breakdown = {};
        
        filteredTransactions.forEach(t => {
            const category = categories.find(c => c.id === t.category_id);
            const categoryName = category?.name || 'Ohne Kategorie';
            
            if (!breakdown[categoryName]) {
                breakdown[categoryName] = { income: 0, expense: 0, color: category?.color || '#64748b' };
            }
            
            if (t.amount > 0) {
                breakdown[categoryName].income += t.amount;
            } else {
                breakdown[categoryName].expense += Math.abs(t.amount);
            }
        });

        return Object.entries(breakdown).map(([name, data]) => ({
            name,
            income: data.income,
            expense: data.expense,
            net: data.income - data.expense,
            color: data.color
        }));
    }, [filteredTransactions, categories]);

    // Tenant breakdown
    const tenantBreakdown = useMemo(() => {
        const breakdown = {};
        
        filteredTransactions.forEach(t => {
            if (t.matched_payment_id) {
                const payment = payments.find(p => p.id === t.matched_payment_id);
                if (payment) {
                    const tenant = tenants.find(tn => tn.id === payment.tenant_id);
                    const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
                    
                    if (!breakdown[tenantName]) {
                        breakdown[tenantName] = 0;
                    }
                    breakdown[tenantName] += t.amount;
                }
            }
        });

        return Object.entries(breakdown)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);
    }, [filteredTransactions, payments, tenants]);

    // Unit breakdown
    const unitBreakdown = useMemo(() => {
        const breakdown = {};
        
        filteredTransactions.forEach(t => {
            if (t.matched_payment_id) {
                const payment = payments.find(p => p.id === t.matched_payment_id);
                if (payment) {
                    const unit = units.find(u => u.id === payment.unit_id);
                    const building = unit ? buildings.find(b => b.id === unit.building_id) : null;
                    const unitName = unit && building ? `${building.name} - ${unit.unit_number}` : 'Unbekannt';
                    
                    if (!breakdown[unitName]) {
                        breakdown[unitName] = 0;
                    }
                    breakdown[unitName] += t.amount;
                }
            }
        });

        return Object.entries(breakdown)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);
    }, [filteredTransactions, payments, units, buildings]);

    // Balance over time
    const balanceOverTime = useMemo(() => {
        if (!dateFilter) return [];

        const monthlyData = {};
        
        filteredTransactions
            .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date))
            .forEach(t => {
                const monthKey = format(parseISO(t.transaction_date), 'yyyy-MM');
                
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expense: 0 };
                }
                
                if (t.amount > 0) {
                    monthlyData[monthKey].income += t.amount;
                } else {
                    monthlyData[monthKey].expense += Math.abs(t.amount);
                }
            });

        let runningBalance = 0;
        return Object.entries(monthlyData)
            .map(([month, data]) => {
                runningBalance += data.income - data.expense;
                return {
                    month: format(parseISO(month + '-01'), 'MMM yyyy', { locale: de }),
                    income: data.income,
                    expense: data.expense,
                    balance: runningBalance
                };
            });
    }, [filteredTransactions, dateFilter]);

    // Summary stats
    const summary = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = filteredTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            income,
            expenses,
            net: income - expenses,
            transactionCount: filteredTransactions.length
        };
    }, [filteredTransactions]);

    const exportToPDF = async () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Title
        pdf.setFontSize(20);
        pdf.text('Finanzbericht', pageWidth / 2, 20, { align: 'center' });
        
        // Date range
        pdf.setFontSize(10);
        pdf.text(`Zeitraum: ${dateRange === 'all' ? 'Alle' : `Letzte ${dateRange} Monate`}`, pageWidth / 2, 28, { align: 'center' });
        pdf.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`, pageWidth / 2, 34, { align: 'center' });
        
        // Summary
        let yPos = 45;
        pdf.setFontSize(14);
        pdf.text('Zusammenfassung', 20, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.text(`Einnahmen: €${summary.income.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, 20, yPos);
        yPos += 6;
        pdf.text(`Ausgaben: €${summary.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, 20, yPos);
        yPos += 6;
        pdf.text(`Nettoeinkommen: €${summary.net.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, 20, yPos);
        yPos += 6;
        pdf.text(`Transaktionen: ${summary.transactionCount}`, 20, yPos);
        yPos += 12;

        // Category breakdown
        pdf.setFontSize(14);
        pdf.text('Kategorien', 20, yPos);
        yPos += 8;
        
        pdf.setFontSize(9);
        categoryBreakdown.forEach(cat => {
            if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
            }
            pdf.text(`${cat.name}: €${cat.net.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, 20, yPos);
            yPos += 5;
        });

        // Capture charts
        const chartsElement = document.getElementById('charts-container');
        if (chartsElement) {
            pdf.addPage();
            const canvas = await html2canvas(chartsElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
        }

        pdf.save(`finanzbericht_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    if (loadingTransactions) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
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
                    title="Finanzberichte"
                    subtitle="Detaillierte Analyse Ihrer Finanzen"
                />
                <Button onClick={exportToPDF} className="bg-emerald-600 hover:bg-emerald-700">
                    <Download className="w-4 h-4 mr-2" />
                    PDF exportieren
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Zeitraum
                            </label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1m">Letzter Monat</SelectItem>
                                    <SelectItem value="3m">Letzte 3 Monate</SelectItem>
                                    <SelectItem value="6m">Letzte 6 Monate</SelectItem>
                                    <SelectItem value="12m">Letztes Jahr</SelectItem>
                                    <SelectItem value="all">Alle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Konto
                            </label>
                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Konten</SelectItem>
                                    {accounts.map(account => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Kategorie
                            </label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Kategorien</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Einnahmen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <p className="text-2xl font-bold text-emerald-600">
                                €{summary.income.toLocaleString('de-DE')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Ausgaben
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                            <p className="text-2xl font-bold text-red-600">
                                €{summary.expenses.toLocaleString('de-DE')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Netto
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            €{summary.net.toLocaleString('de-DE')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Transaktionen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-800">
                            {summary.transactionCount}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div id="charts-container" className="space-y-6">
                {/* Balance over time */}
                {balanceOverTime.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Kontostände über Zeit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={balanceOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="balance" stroke="#10b981" name="Saldo" strokeWidth={2} />
                                    <Line type="monotone" dataKey="income" stroke="#3b82f6" name="Einnahmen" />
                                    <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Ausgaben" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Nach Kategorie</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={categoryBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="income" fill="#10b981" name="Einnahmen" />
                                    <Bar dataKey="expense" fill="#ef4444" name="Ausgaben" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Tenant breakdown */}
                    {tenantBreakdown.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Nach Mieter</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={tenantBreakdown} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={120} />
                                        <Tooltip />
                                        <Bar dataKey="amount" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Unit breakdown */}
                {unitBreakdown.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Nach Wohneinheit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={unitBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="amount" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Transaction Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Neueste Transaktionen</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Datum</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Beschreibung</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Kategorie</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Konto</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Betrag</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.slice(0, 50).map((transaction) => {
                                    const category = categories.find(c => c.id === transaction.category_id);
                                    const account = accounts.find(a => a.id === transaction.account_id);
                                    
                                    return (
                                        <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {format(parseISO(transaction.transaction_date), 'dd.MM.yyyy')}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-800">
                                                <div>
                                                    <p className="font-medium">{transaction.sender_receiver || '-'}</p>
                                                    <p className="text-xs text-slate-500">{transaction.description}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {category && (
                                                    <span 
                                                        className="px-2 py-1 rounded text-xs text-white"
                                                        style={{ backgroundColor: category.color }}
                                                    >
                                                        {category.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {account?.name || '-'}
                                            </td>
                                            <td className={`py-3 px-4 text-sm text-right font-semibold ${
                                                transaction.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                                {transaction.amount > 0 ? '+' : ''}
                                                €{transaction.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}