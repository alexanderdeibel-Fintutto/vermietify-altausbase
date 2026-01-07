import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Clock,
    RefreshCw,
    Search,
    ArrowRight,
    BarChart3,
    PieChart,
    Activity,
    CheckCircle2,
    Flame,
    Target
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function UserFehler() {
    const [activeTab, setActiveTab] = useState('tickets');
    const [filters, setFilters] = useState({
        status: 'Alle',
        kategorie: 'Alle',
        search: ''
    });
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const navigate = useNavigate();

    // Auto-Refresh für Live-Daten
    const { data: problems = [], refetch: refetchProblems } = useQuery({
        queryKey: ['user-problems-live'],
        queryFn: () => base44.entities.UserProblem.list('-created_date', 500),
        refetchInterval: activeTab === 'tickets' ? 30000 : false // 30 Sekunden für Tickets-Tab
    });

    const { data: statistics = [], refetch: refetchStats } = useQuery({
        queryKey: ['problem-statistics-live'],
        queryFn: () => base44.entities.ProblemStatistics.list('-datum', 30),
        refetchInterval: activeTab === 'statistiken' ? 300000 : false // 5 Minuten für Statistiken-Tab
    });

    // Zusätzlicher Refresh für kritische Tickets alle 10 Sekunden
    useEffect(() => {
        if (activeTab !== 'tickets') return;
        
        const criticalInterval = setInterval(() => {
            refetchProblems();
            setLastUpdate(new Date());
        }, 10000); // 10 Sekunden für kritische

        return () => clearInterval(criticalInterval);
    }, [activeTab, refetchProblems]);

    // Live-Statistiken berechnen
    const today = new Date().toISOString().split('T')[0];
    const todayProblems = problems.filter(p => p.created_date && p.created_date.startsWith(today));
    const openProblems = problems.filter(p => p.status !== 'Gelöst' && p.status !== 'Wont-Fix');
    const criticalProblems = problems.filter(p => p.schweregrad === 'Kritisch' && p.status !== 'Gelöst');
    const withSolutionTime = problems.filter(p => p.loesungszeit_stunden && p.status === 'Gelöst');
    const avgSolutionTime = withSolutionTime.length > 0
        ? (withSolutionTime.reduce((sum, p) => sum + p.loesungszeit_stunden, 0) / withSolutionTime.length).toFixed(1)
        : 0;

    // Gestern für Trend-Vergleich
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayProblems = problems.filter(p => p.created_date && p.created_date.startsWith(yesterday));
    const todayTrend = todayProblems.length > yesterdayProblems.length ? '↗️' : todayProblems.length < yesterdayProblems.length ? '↘️' : '→';

    // Filter anwenden
    const filteredProblems = problems.filter(p => {
        if (filters.status !== 'Alle' && p.status !== filters.status) return false;
        if (filters.kategorie !== 'Alle' && p.kategorie !== filters.kategorie) return false;
        if (filters.search && !p.problem_titel.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    // Nach Schweregrad gruppieren
    const kritisch = filteredProblems.filter(p => p.schweregrad === 'Kritisch' && p.status !== 'Gelöst');
    const hoch = filteredProblems.filter(p => p.schweregrad === 'Hoch' && p.status !== 'Gelöst');
    const normal = filteredProblems.filter(p => ['Mittel', 'Niedrig', 'Kosmetisch'].includes(p.schweregrad) && p.status !== 'Gelöst');

    // Chart-Daten vorbereiten
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
        const dayProblems = problems.filter(p => p.created_date && p.created_date.startsWith(date));
        return {
            datum: format(new Date(date), 'dd.MM', { locale: de }),
            probleme: dayProblems.length,
            gelöst: dayProblems.filter(p => p.status === 'Gelöst').length
        };
    });

    // Top 10 Probleme diese Woche
    const thisWeek = subDays(new Date(), 7);
    const weekProblems = problems.filter(p => new Date(p.created_date) > thisWeek);
    const problemCounts = weekProblems.reduce((acc, p) => {
        const key = p.problem_titel.substring(0, 50);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const top10Problems = Object.entries(problemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([titel, anzahl]) => ({ titel, anzahl }));

    // Kategorie-Verteilung
    const kategorieData = problems.reduce((acc, p) => {
        acc[p.kategorie] = (acc[p.kategorie] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(kategorieData).map(([name, value]) => ({ name, value }));
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // Neu aufkommende Probleme (24h)
    const last24h = subDays(new Date(), 1);
    const recentProblems = problems.filter(p => new Date(p.created_date) > last24h);
    const recentCounts = recentProblems.reduce((acc, p) => {
        const key = p.problem_titel;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const emergingIssues = Object.entries(recentCounts)
        .filter(([, count]) => count >= 2)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([titel, anzahl]) => ({ titel, anzahl }));

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${Math.floor(diffHours / 24)}d`;
    };

    const severityColors = {
        'Kritisch': 'bg-red-100 text-red-800 border-red-300',
        'Hoch': 'bg-orange-100 text-orange-800 border-orange-300',
        'Mittel': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'Niedrig': 'bg-blue-100 text-blue-800 border-blue-300',
        'Kosmetisch': 'bg-slate-100 text-slate-800 border-slate-300'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">🆘 Support-Center (Live)</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Auto-Refresh: {activeTab === 'tickets' ? '10-30s' : activeTab === 'statistiken' ? '5min' : 'Aus'} • 
                        Letztes Update: {format(lastUpdate, 'HH:mm:ss', { locale: de })}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        refetchProblems();
                        refetchStats();
                        setLastUpdate(new Date());
                    }}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Jetzt aktualisieren
                </Button>
            </div>

            {/* Live-Statistik Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {openProblems.length} <TrendingUp className="w-4 h-4 inline text-orange-600" />
                                </p>
                                <p className="text-xs text-slate-600">Offen</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {todayProblems.length} {todayTrend}
                                </p>
                                <p className="text-xs text-slate-600">Heute</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Flame className="w-8 h-8 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {criticalProblems.length} ⚠️
                                </p>
                                <p className="text-xs text-slate-600">Kritisch</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {avgSolutionTime}h <TrendingUp className="w-4 h-4 inline text-purple-600" />
                                </p>
                                <p className="text-xs text-slate-600">Ø Zeit</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="tickets">
                        Tickets {openProblems.length > 0 && <Badge className="ml-2 bg-red-600">{openProblems.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="statistiken">Statistiken</TabsTrigger>
                    <TabsTrigger value="wissensdatenbank">Wissensdatenbank</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                {/* TAB: TICKETS */}
                <TabsContent value="tickets" className="space-y-4">
                    {/* Filter */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex gap-3 flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Suche nach Problem..."
                                            value={filters.search}
                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alle">Alle Status</SelectItem>
                                        <SelectItem value="Neu">Neu</SelectItem>
                                        <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                                        <SelectItem value="Gelöst">Gelöst</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.kategorie}
                                    onValueChange={(value) => setFilters({ ...filters, kategorie: value })}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alle">Alle Kategorien</SelectItem>
                                        <SelectItem value="Bedienung">Bedienung</SelectItem>
                                        <SelectItem value="Bug">Bug</SelectItem>
                                        <SelectItem value="Datenimport">Datenimport</SelectItem>
                                        <SelectItem value="Performance">Performance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kritische Tickets (Update alle 10 Sek) */}
                    {kritisch.length > 0 && (
                        <Card className="border-2 border-red-300 bg-red-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-900">
                                    <Flame className="w-5 h-5" />
                                    🔴 KRITISCH ({kritisch.length}) - Live-Update alle 10 Sek
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {kritisch.map(problem => (
                                        <div
                                            key={problem.id}
                                            className="flex items-center gap-4 p-3 bg-white rounded-lg border border-red-200 hover:shadow-md cursor-pointer transition-all"
                                            onClick={() => navigate(createPageUrl('SupportCenter'))}
                                        >
                                            <Badge className="bg-red-600 text-white">#{problem.id.substring(0, 6)}</Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{problem.problem_titel}</p>
                                                <p className="text-sm text-slate-600">{problem.created_by || 'Anonym'}</p>
                                            </div>
                                            <Badge variant="outline" className="text-red-700">{formatTimeAgo(problem.created_date)}</Badge>
                                            <ArrowRight className="w-5 h-5 text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Hohe Priorität (Update alle 30 Sek) */}
                    {hoch.length > 0 && (
                        <Card className="border-2 border-orange-300 bg-orange-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-900">
                                    <AlertCircle className="w-5 h-5" />
                                    🟡 HOCH ({hoch.length}) - Update alle 30 Sek
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {hoch.slice(0, 5).map(problem => (
                                        <div
                                            key={problem.id}
                                            className="flex items-center gap-4 p-3 bg-white rounded-lg border border-orange-200 hover:shadow-md cursor-pointer transition-all"
                                            onClick={() => navigate(createPageUrl('SupportCenter'))}
                                        >
                                            <Badge className="bg-orange-600 text-white">#{problem.id.substring(0, 6)}</Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{problem.problem_titel}</p>
                                                <p className="text-sm text-slate-600">{problem.kategorie}</p>
                                            </div>
                                            <Badge variant="outline">{formatTimeAgo(problem.created_date)}</Badge>
                                            <ArrowRight className="w-5 h-5 text-slate-400" />
                                        </div>
                                    ))}
                                    {hoch.length > 5 && (
                                        <Button variant="outline" className="w-full" onClick={() => navigate(createPageUrl('SupportCenter'))}>
                                            {hoch.length - 5} weitere anzeigen
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Normal (Update alle 60 Sek) */}
                    {normal.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    🟢 NORMAL ({normal.length}) - Update alle 60 Sek
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {normal.slice(0, 5).map(problem => (
                                        <div
                                            key={problem.id}
                                            className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                                            onClick={() => navigate(createPageUrl('SupportCenter'))}
                                        >
                                            <Badge variant="outline">#{problem.id.substring(0, 6)}</Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{problem.problem_titel}</p>
                                            </div>
                                            <Badge className={severityColors[problem.schweregrad]}>{problem.schweregrad}</Badge>
                                            <ArrowRight className="w-5 h-5 text-slate-400" />
                                        </div>
                                    ))}
                                    {normal.length > 5 && (
                                        <Button variant="outline" className="w-full" onClick={() => navigate(createPageUrl('SupportCenter'))}>
                                            {normal.length - 5} weitere anzeigen
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* TAB: STATISTIKEN */}
                <TabsContent value="statistiken" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                📈 Probleme pro Tag (letzte 30 Tage)
                            </CardTitle>
                            <p className="text-sm text-slate-600">Auto-Update alle 5 Minuten</p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={last30Days}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="datum" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="probleme" stroke="#ef4444" name="Neue Probleme" strokeWidth={2} />
                                    <Line type="monotone" dataKey="gelöst" stroke="#10b981" name="Gelöst" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                📊 Top 10 Probleme (diese Woche)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={top10Problems} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="titel" width={200} />
                                    <Tooltip />
                                    <Bar dataKey="anzahl" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="w-5 h-5" />
                                🎯 Kategorie-Verteilung
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPie>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: WISSENSDATENBANK */}
                <TabsContent value="wissensdatenbank">
                    <Card>
                        <CardHeader>
                            <CardTitle>📚 Dokumentierte Lösungen</CardTitle>
                            <p className="text-sm text-slate-600">Keine Auto-Updates - Statischer Inhalt</p>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <p className="text-slate-600 mb-4">
                                    Hier finden Sie alle dokumentierten Lösungen zu häufigen Problemen.
                                </p>
                                <Button onClick={() => navigate(createPageUrl('HilfeCenter'))}>
                                    Zum Hilfe-Center
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: TRENDS */}
                <TabsContent value="trends" className="space-y-4">
                    <Card className="border-2 border-orange-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-900">
                                <Flame className="w-5 h-5" />
                                🔥 Neu aufkommende Probleme (letzte 24h)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {emergingIssues.length === 0 ? (
                                <p className="text-slate-600 text-center py-4">
                                    ✅ Keine auffälligen Problem-Häufungen in den letzten 24 Stunden
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {emergingIssues.map((issue, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                                <span className="text-xl font-bold text-orange-700">{issue.anzahl}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900">{issue.titel}</p>
                                                <p className="text-sm text-orange-700">
                                                    {issue.anzahl} Meldungen {issue.anzahl >= 5 ? '⚠️ STEIGEND!' : '→ Beobachten'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-900">
                                <TrendingDown className="w-5 h-5" />
                                📉 Verbesserte Bereiche
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-slate-900">Betriebskostenabrechnung</p>
                                        <p className="text-sm text-green-700">-45% Probleme seit letztem Update</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-slate-900">Dokumenten-Upload</p>
                                        <p className="text-sm text-green-700">-30% Fehler durch neue Validierung</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}