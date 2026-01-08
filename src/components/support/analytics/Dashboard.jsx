import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertCircle, Clock, Star, ArrowUp } from 'lucide-react';
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Dashboard({ problems, solutions, onNavigate }) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const lastWeekStart = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    
    const todayProblems = problems.filter(p => p.created_date?.startsWith(today));
    const yesterdayProblems = problems.filter(p => p.created_date?.startsWith(yesterday));
    const openProblems = problems.filter(p => !['Gelöst', 'Wont-Fix'].includes(p.status));
    const kritisch = openProblems.filter(p => p.schweregrad === 'Kritisch');
    const lastWeekProblems = problems.filter(p => p.created_date >= lastWeekStart);
    
    const withSolutionTime = problems.filter(p => p.loesungszeit_stunden);
    const avgSolutionTime = withSolutionTime.length > 0
        ? (withSolutionTime.reduce((sum, p) => sum + p.loesungszeit_stunden, 0) / withSolutionTime.length).toFixed(1)
        : 0;
    
    const withRating = problems.filter(p => p.user_zufriedenheit);
    const avgRating = withRating.length > 0
        ? (withRating.reduce((sum, p) => sum + p.user_zufriedenheit, 0) / withRating.length).toFixed(1)
        : 0;

    // Vergleiche mit Vorwoche
    const prevWeekStart = format(subDays(new Date(), 14), 'yyyy-MM-dd');
    const prevWeekEnd = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const prevWeekProblems = problems.filter(p => p.created_date >= prevWeekStart && p.created_date < prevWeekEnd);
    
    const todayChange = todayProblems.length - yesterdayProblems.length;
    const weekChange = lastWeekProblems.length - prevWeekProblems.length;

    // Häufigkeits-Analyse - Probleme die sich häufen
    const last6Hours = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const recentProblems = problems.filter(p => p.created_date >= last6Hours);
    const problemTitles = {};
    recentProblems.forEach(p => {
        const key = p.problem_titel.toLowerCase().substring(0, 30);
        problemTitles[key] = (problemTitles[key] || 0) + 1;
    });
    const trending = Object.entries(problemTitles)
        .filter(([_, count]) => count >= 3)
        .sort(([_, a], [__, b]) => b - a);

    // Überfällige Tickets
    const overdue = openProblems.filter(p => {
        if (!p.created_date) return false;
        const hours = (Date.now() - new Date(p.created_date)) / (1000 * 60 * 60);
        return hours > 24;
    });

    // Mini Sparkline Daten (7 Tage)
    const sparklineData = Array.from({ length: 7 }, (_, i) => {
        const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        return problems.filter(p => p.created_date?.startsWith(date)).length;
    });

    // Kategorie Pie
    const catData = problems.reduce((acc, p) => {
        acc[p.kategorie] = (acc[p.kategorie] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(catData).slice(0, 5).map(([name, value]) => ({ name, value }));
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="space-y-6">
        {/* Executive Dashboard Integration */}
        <ExecutiveDashboard problems={problems} onNavigate={onNavigate} />
            {/* KPI-Karten */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Offen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{openProblems.length}</div>
                        <div className="flex items-center gap-1 text-sm mt-1">
                            {weekChange >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-green-500" />
                            )}
                            <span className={weekChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                                {weekChange >= 0 ? '+' : ''}{weekChange}
                            </span>
                            <span className="text-slate-500">vs. Vorwoche</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Kritisch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{kritisch.length}</div>
                        <div className="text-sm text-slate-500 mt-1">Sofortige Aufmerksamkeit</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Heute</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{todayProblems.length}</div>
                        <div className="flex items-center gap-1 text-sm mt-1">
                            {todayChange >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-orange-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-green-500" />
                            )}
                            <span className={todayChange >= 0 ? 'text-orange-600' : 'text-green-600'}>
                                {todayChange >= 0 ? '+' : ''}{todayChange}
                            </span>
                            <span className="text-slate-500">vs. Gestern</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Ø Zeit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{avgSolutionTime}h</div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                            <Clock className="w-4 h-4" />
                            <span>Lösungszeit</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 flex items-center gap-1">
                            {avgRating}
                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="text-sm text-slate-500 mt-1">{withRating.length} Bewertungen</div>
                    </CardContent>
                </Card>
            </div>

            {/* Fokus-Bereiche */}
            <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">🎯 Fokus-Bereiche</h2>
                
                {trending.length > 0 && (
                    <Card className="border-2 border-red-300 bg-red-50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                                <div className="flex-1">
                                    <p className="font-semibold text-red-900">⚠️ ALARM: Neues Problem häuft sich</p>
                                    <p className="text-red-800 mt-1">
                                        "{trending[0][0]}" - {trending[0][1]}x in den letzten 6 Stunden
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                                            Details ansehen
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            Als Bug eskalieren
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {overdue.length > 0 && (
                    <Card className="border-2 border-orange-300 bg-orange-50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Clock className="w-6 h-6 text-orange-600 mt-1" />
                                <div className="flex-1">
                                    <p className="font-semibold text-orange-900">🔴 ÜBERFÄLLIG: {overdue.length} Tickets >24h ohne Antwort</p>
                                    <div className="mt-3">
                                        <Button 
                                            size="sm" 
                                            className="bg-orange-600 hover:bg-orange-700"
                                            onClick={() => onNavigate('tickets')}
                                        >
                                            Sofort ansehen
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Mini Charts */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Tickets/Tag (7 Tage)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={80}>
                            <LineChart data={sparklineData.map((val, i) => ({ value: val }))}>
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                            Trend: {sparklineData[6] > sparklineData[0] ? '↗️ Steigend' : '↘️ Fallend'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Kategorien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={80}>
                            <RechartsPie>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={20}
                                    outerRadius={40}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </RechartsPie>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {pieData.slice(0, 3).map((cat, i) => (
                                <Badge key={cat.name} variant="outline" className="text-xs">
                                    {cat.name} ({cat.value})
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">🎬 Quick-Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => onNavigate('tickets')}>
                            Alle Offenen ({openProblems.length})
                        </Button>
                        <Button variant="outline" onClick={() => onNavigate('analysen')}>
                            Detaillierte Analysen
                        </Button>
                        <Button variant="outline">
                            Export PDF
                        </Button>
                        <Button variant="outline">
                            Wochenbericht
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}