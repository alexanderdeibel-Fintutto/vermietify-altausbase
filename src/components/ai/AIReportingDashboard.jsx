import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, TrendingUp, Users, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AIUsageChart from './AIUsageChart';

export default function AIReportingDashboard() {
    const [user, setUser] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [analysis, setAnalysis] = useState(null);
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUser();
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    }, []);

    useEffect(() => {
        if (dateRange.start && dateRange.end) {
            loadAnalysis();
        }
    }, [dateRange]);

    async function loadUser() {
        const u = await base44.auth.me();
        setUser(u);
    }

    async function loadAnalysis() {
        setLoading(true);
        try {
            const days = Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24));
            const { data } = await base44.functions.invoke('analyzeAICostPatterns', { days });
            
            if (data.success) {
                setAnalysis(data);
                setOpportunities(data.top_opportunities || []);
            }
        } catch (error) {
            toast.error('Fehler beim Laden der Analyse');
        } finally {
            setLoading(false);
        }
    }

    async function exportCSV() {
        try {
            const response = await base44.functions.invoke('exportAIReportCSV', {
                startDate: dateRange.start,
                endDate: dateRange.end
            });
            
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai_report_${dateRange.start}_${dateRange.end}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('CSV exportiert');
        } catch (error) {
            toast.error('Export fehlgeschlagen');
        }
    }

    async function detectSavings() {
        try {
            const { data } = await base44.functions.invoke('detectAICostSavings');
            if (data.success) {
                setOpportunities(data.opportunities);
                toast.success('Einsparpotenziale erkannt');
            }
        } catch (error) {
            toast.error('Fehler bei der Analyse');
        }
    }

    if (user?.role !== 'admin') {
        return (
            <div className="p-6 text-center">
                <p className="text-slate-600">Nur für Administratoren verfügbar</p>
            </div>
        );
    }

    const userChartData = analysis?.cost_by_user ? 
        Object.entries(analysis.cost_by_user).map(([email, stats]) => ({
            name: email.split('@')[0],
            kosten: parseFloat(stats.total_cost.toFixed(2)),
            requests: stats.total_requests
        })).slice(0, 10) : [];

    const featureChartData = analysis?.cost_by_feature ?
        Object.entries(analysis.cost_by_feature).map(([feature, stats]) => ({
            name: feature,
            kosten: parseFloat(stats.total_cost.toFixed(2)),
            requests: stats.total_requests,
            cache_savings: parseFloat(stats.cache_savings.toFixed(2))
        })) : [];

    const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">AI Reporting Dashboard</h1>
                <Button onClick={exportCSV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    CSV Export
                </Button>
            </div>

            {/* Date Range Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Label>Von</Label>
                            <Input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            />
                        </div>
                        <div className="flex-1">
                            <Label>Bis</Label>
                            <Input 
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            />
                        </div>
                        <Button onClick={loadAnalysis} disabled={loading} className="mt-6">
                            Aktualisieren
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs */}
            {analysis && (
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{analysis.total_cost?.toFixed(2)} €</div>
                            <div className="text-sm text-slate-600">Gesamtkosten</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{analysis.total_requests}</div>
                            <div className="text-sm text-slate-600">Requests</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                                {(analysis.total_cost / analysis.total_requests).toFixed(3)} €
                            </div>
                            <div className="text-sm text-slate-600">Ø pro Request</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">
                                {Object.values(analysis.cost_by_feature || {})
                                    .reduce((sum, f) => sum + f.cache_savings, 0)
                                    .toFixed(2)} €
                            </div>
                            <div className="text-sm text-slate-600">Cache-Ersparnis</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* AI Usage Chart */}
            <AIUsageChart />

            {/* Kosten pro User */}
            {userChartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Kosten pro Benutzer (Top 10)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={userChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="kosten" fill="#1E3A8A" name="Kosten (€)" />
                                <Bar dataKey="requests" fill="#F97316" name="Requests" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Kosten pro Feature */}
            {featureChartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Kosten pro Feature
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={featureChartData}
                                        dataKey="kosten"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {featureChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {featureChartData.map((feat, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg">
                                        <div className="font-semibold">{feat.name}</div>
                                        <div className="text-sm text-slate-600">
                                            {feat.kosten.toFixed(2)} € | {feat.requests} Requests
                                        </div>
                                        <div className="text-xs text-green-600">
                                            Cache: -{feat.cache_savings.toFixed(2)} €
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top 5 Einsparpotenziale */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Top 5 Einsparpotenziale
                        </CardTitle>
                        <Button onClick={detectSavings} variant="outline" size="sm">
                            Neu analysieren
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {opportunities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Keine Einsparpotenziale erkannt
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {opportunities.map((opp, idx) => (
                                <div key={idx} className="p-4 border-l-4 border-green-500 bg-green-50 rounded">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold flex items-center gap-2">
                                                #{idx + 1} {opp.title}
                                                <span className="text-xs px-2 py-1 bg-white rounded">
                                                    Score: {opp.priority_score}
                                                </span>
                                            </div>
                                            <div className="text-sm mt-1">{opp.description}</div>
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <div>
                                                    <span className="text-slate-600">Aktuell: </span>
                                                    <span className="font-semibold">{opp.current_cost_eur?.toFixed(2)} €</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-600">Einsparpotenzial: </span>
                                                    <span className="font-semibold text-green-600">
                                                        -{opp.potential_savings_eur?.toFixed(2)} €/Monat
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-600">Aufwand: </span>
                                                    <span>{opp.implementation_effort}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}