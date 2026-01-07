import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TrendAnalysis({ problems }) {
    // Letzten 14 Tage analysieren
    const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
        const dayProblems = problems.filter(p => p.created_date && p.created_date.startsWith(date));
        return {
            datum: format(new Date(date), 'dd.MM', { locale: de }),
            probleme: dayProblems.length,
            kritisch: dayProblems.filter(p => p.schweregrad === 'Kritisch').length,
            gelöst: dayProblems.filter(p => p.status === 'Gelöst').length
        };
    });

    // Woche 1 vs Woche 2 Vergleich
    const week1 = last14Days.slice(0, 7).reduce((sum, d) => sum + d.probleme, 0);
    const week2 = last14Days.slice(7, 14).reduce((sum, d) => sum + d.probleme, 0);
    const weekChange = week2 - week1;
    const weekChangePercent = week1 > 0 ? ((weekChange / week1) * 100).toFixed(1) : 0;

    // Häufigste Probleme (letzte 7 Tage)
    const last7Days = subDays(new Date(), 7);
    const recentProblems = problems.filter(p => new Date(p.created_date) > last7Days);
    const problemCounts = recentProblems.reduce((acc, p) => {
        const key = p.problem_titel.substring(0, 60);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const topProblems = Object.entries(problemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([titel, anzahl]) => ({ titel, anzahl }));

    // Kategorie-Trends
    const kategorieTrends = {};
    ['Bedienung', 'Bug', 'Datenimport', 'Performance', 'Dokumentenerstellung'].forEach(kat => {
        const week1Count = problems.filter(p => {
            const date = new Date(p.created_date);
            return date > subDays(new Date(), 14) && date <= subDays(new Date(), 7) && p.kategorie === kat;
        }).length;
        const week2Count = problems.filter(p => {
            const date = new Date(p.created_date);
            return date > subDays(new Date(), 7) && p.kategorie === kat;
        }).length;
        const change = week2Count - week1Count;
        kategorieTrends[kat] = { week1: week1Count, week2: week2Count, change };
    });

    // Verbesserungsbereiche erkennen
    const improvements = Object.entries(kategorieTrends)
        .filter(([, data]) => data.change < -2)
        .sort(([, a], [, b]) => a.change - b.change)
        .slice(0, 3);

    // Verschlechterungen erkennen
    const regressions = Object.entries(kategorieTrends)
        .filter(([, data]) => data.change > 2)
        .sort(([, a], [, b]) => b.change - a.change)
        .slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Gesamt-Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {weekChange > 0 ? (
                            <TrendingUp className="w-5 h-5 text-red-600" />
                        ) : weekChange < 0 ? (
                            <TrendingDown className="w-5 h-5 text-green-600" />
                        ) : (
                            <Minus className="w-5 h-5 text-slate-600" />
                        )}
                        Wöchentlicher Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-3xl font-bold text-slate-900">
                                {weekChange > 0 ? '+' : ''}{weekChange}
                            </p>
                            <p className="text-sm text-slate-600">Probleme diese Woche</p>
                        </div>
                        <Badge className={
                            weekChange > 0 ? 'bg-red-100 text-red-800' :
                            weekChange < 0 ? 'bg-green-100 text-green-800' :
                            'bg-slate-100 text-slate-800'
                        }>
                            {weekChange > 0 ? '+' : ''}{weekChangePercent}%
                        </Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={last14Days}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="datum" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="probleme" stroke="#ef4444" strokeWidth={2} name="Probleme" />
                            <Line type="monotone" dataKey="kritisch" stroke="#dc2626" strokeWidth={2} name="Kritisch" />
                            <Line type="monotone" dataKey="gelöst" stroke="#10b981" strokeWidth={2} name="Gelöst" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top 10 Probleme */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Häufigste Probleme (letzte 7 Tage)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={topProblems} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="titel" width={250} />
                            <Tooltip />
                            <Bar dataKey="anzahl" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Verbesserungen */}
            {improvements.length > 0 && (
                <Card className="border-2 border-green-300 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-900">
                            <CheckCircle2 className="w-5 h-5" />
                            📉 Verbesserungsbereiche
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {improvements.map(([kategorie, data]) => (
                                <div key={kategorie} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                                    <TrendingDown className="w-8 h-8 text-green-600" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{kategorie}</p>
                                        <p className="text-sm text-slate-600">
                                            {data.week1} → {data.week2} Probleme ({data.change} weniger)
                                        </p>
                                    </div>
                                    <Badge className="bg-green-600 text-white">
                                        {Math.abs(data.change)} weniger
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Verschlechterungen */}
            {regressions.length > 0 && (
                <Card className="border-2 border-orange-300 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-900">
                            <AlertTriangle className="w-5 h-5" />
                            📈 Bereiche mit mehr Problemen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {regressions.map(([kategorie, data]) => (
                                <div key={kategorie} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                                    <TrendingUp className="w-8 h-8 text-orange-600" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{kategorie}</p>
                                        <p className="text-sm text-slate-600">
                                            {data.week1} → {data.week2} Probleme (+{data.change} mehr)
                                        </p>
                                    </div>
                                    <Badge className="bg-orange-600 text-white">
                                        +{data.change} mehr
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}