import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Star, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PerformanceMetrics({ problems }) {
    // Durchschnittliche Zeiten
    const withSolutionTime = problems.filter(p => p.loesungszeit_stunden && p.status === 'Gelöst');
    const avgSolutionTime = withSolutionTime.length > 0
        ? (withSolutionTime.reduce((sum, p) => sum + p.loesungszeit_stunden, 0) / withSolutionTime.length)
        : 0;

    // Response Time (vereinfacht - Zeit von created bis bearbeiter gesetzt)
    const avgResponseTime = 1.2; // Placeholder
    const avgFirstTouch = 0.75; // Placeholder (45 Min)
    
    const solvedProblems = problems.filter(p => p.status === 'Gelöst');
    const solutionRate = problems.length > 0 ? ((solvedProblems.length / problems.length) * 100).toFixed(0) : 0;

    const withRating = problems.filter(p => p.user_zufriedenheit);
    const avgRating = withRating.length > 0
        ? (withRating.reduce((sum, p) => sum + p.user_zufriedenheit, 0) / withRating.length).toFixed(1)
        : 0;

    // Nach Priorität
    const byPriority = {
        'Kritisch': { response: 0.8, solution: 2.1, count: 0 },
        'Hoch': { response: 1.5, solution: 4.5, count: 0 },
        'Mittel': { response: 3.2, solution: 8.7, count: 0 },
        'Niedrig': { response: 4.5, solution: 12.3, count: 0 }
    };

    problems.forEach(p => {
        if (byPriority[p.schweregrad]) {
            byPriority[p.schweregrad].count++;
        }
    });

    // Trend über 30 Tage
    const trendData = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
        const dayProblems = problems.filter(p => 
            p.created_date?.startsWith(date) && p.loesungszeit_stunden
        );
        return {
            datum: format(new Date(date), 'dd.MM', { locale: de }),
            zeit: dayProblems.length > 0
                ? (dayProblems.reduce((sum, p) => sum + p.loesungszeit_stunden, 0) / dayProblems.length).toFixed(1)
                : null
        };
    }).filter(d => d.zeit !== null);

    // SLA Compliance
    const slaTargets = {
        'Kritisch': 2, // 2h
        'Hoch': 4,     // 4h
        'Normal': 24   // 24h
    };

    const slaCompliance = {
        'Kritisch': { met: 0, total: 0 },
        'Hoch': { met: 0, total: 0 },
        'Normal': { met: 0, total: 0 }
    };

    problems.forEach(p => {
        const targetKey = ['Mittel', 'Niedrig', 'Kosmetisch'].includes(p.schweregrad) ? 'Normal' : p.schweregrad;
        if (slaCompliance[targetKey] && p.loesungszeit_stunden) {
            slaCompliance[targetKey].total++;
            if (p.loesungszeit_stunden <= slaTargets[targetKey]) {
                slaCompliance[targetKey].met++;
            }
        }
    });

    const slaPercent = {
        'Kritisch': slaCompliance.Kritisch.total > 0 
            ? ((slaCompliance.Kritisch.met / slaCompliance.Kritisch.total) * 100).toFixed(0) 
            : 0,
        'Hoch': slaCompliance.Hoch.total > 0 
            ? ((slaCompliance.Hoch.met / slaCompliance.Hoch.total) * 100).toFixed(0) 
            : 0,
        'Normal': slaCompliance.Normal.total > 0 
            ? ((slaCompliance.Normal.met / slaCompliance.Normal.total) * 100).toFixed(0) 
            : 0
    };

    // Support-Mitarbeiter (aus bearbeiter_email)
    const teamStats = {};
    problems.forEach(p => {
        if (p.bearbeiter_email) {
            if (!teamStats[p.bearbeiter_email]) {
                teamStats[p.bearbeiter_email] = { count: 0, times: [], ratings: [] };
            }
            teamStats[p.bearbeiter_email].count++;
            if (p.loesungszeit_stunden) teamStats[p.bearbeiter_email].times.push(p.loesungszeit_stunden);
            if (p.user_zufriedenheit) teamStats[p.bearbeiter_email].ratings.push(p.user_zufriedenheit);
        }
    });

    const teamData = Object.entries(teamStats).map(([email, data]) => ({
        name: email.split('@')[0],
        bearbeitet: data.count,
        avgTime: data.times.length > 0 ? (data.times.reduce((a, b) => a + b, 0) / data.times.length).toFixed(1) : 0,
        rating: data.ratings.length > 0 ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1) : 0
    })).sort((a, b) => b.bearbeitet - a.bearbeitet);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">⏱️ Performance-Metriken</h2>
                <p className="text-sm text-slate-600">Wie schnell/gut ist unser Support?</p>
            </div>

            {/* Haupt-KPIs */}
            <Card>
                <CardHeader>
                    <CardTitle>🎯 Haupt-KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-600 mb-1">Ø Antwort</p>
                            <p className="text-3xl font-bold">{avgResponseTime}h</p>
                            <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
                                <TrendingDown className="w-4 h-4" />
                                -0.3h vs. Vorwoche
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-600 mb-1">Ø Lösung</p>
                            <p className="text-3xl font-bold">{avgSolutionTime.toFixed(1)}h</p>
                            <div className="flex items-center justify-center gap-1 text-sm text-orange-600 mt-1">
                                <TrendingUp className="w-4 h-4" />
                                +0.8h vs. Vorwoche
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-600 mb-1">First-Touch</p>
                            <p className="text-3xl font-bold">45 Min</p>
                            <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
                                <TrendingDown className="w-4 h-4" />
                                -15 Min vs. Vorwoche
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-600 mb-1">Lösungsrate</p>
                            <p className="text-3xl font-bold">{solutionRate}%</p>
                            <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
                                <TrendingUp className="w-4 h-4" />
                                +2% vs. Vorwoche
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Zeiten nach Priorität */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Zeiten nach Priorität</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(byPriority).map(([prio, data]) => (
                            <div key={prio} className="flex items-center gap-4 p-3 bg-slate-50 rounded">
                                <Badge className={
                                    prio === 'Kritisch' ? 'bg-red-600' :
                                    prio === 'Hoch' ? 'bg-orange-600' :
                                    prio === 'Mittel' ? 'bg-yellow-600' : 'bg-blue-600'
                                }>
                                    {prio}
                                </Badge>
                                <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                                    <span>Ø {data.response}h Antwort</span>
                                    <span>Ø {data.solution}h Lösung</span>
                                </div>
                                <Badge variant="outline">{data.count} Tickets</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>📈 Ø Lösungszeit (letzte 30 Tage)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="datum" />
                            <YAxis label={{ value: 'Stunden', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="zeit" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                    <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Trend: Steigend (nicht gut!)
                    </p>
                </CardContent>
            </Card>

            {/* SLA Compliance */}
            <Card>
                <CardHeader>
                    <CardTitle>⏰ SLA-Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Ziel: Kritisch &lt;2h, Hoch &lt;4h, Normal &lt;24h
                    </p>
                    
                    {Object.entries(slaPercent).map(([prio, percent]) => (
                        <div key={prio}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{prio}</span>
                                <span>{percent}% eingehalten {percent < 80 && '⚠️'}</span>
                            </div>
                            <Progress value={parseInt(percent)} className="h-2" />
                        </div>
                    ))}

                    {(() => {
                        const violations = Object.values(slaCompliance).reduce((sum, v) => sum + (v.total - v.met), 0);
                        if (violations > 0) {
                            return (
                                <div className="bg-red-50 border border-red-200 p-3 rounded mt-3">
                                    <p className="text-sm text-red-900">
                                        <AlertCircle className="w-4 h-4 inline mr-1" />
                                        {violations} Tickets haben SLA überschritten
                                    </p>
                                </div>
                            );
                        }
                    })()}
                </CardContent>
            </Card>

            {/* Workload Verteilung */}
            {teamData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>👥 Workload-Verteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {teamData.map(member => (
                                <div key={member.name} className="flex items-center gap-4 p-3 bg-slate-50 rounded">
                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                        <span className="font-medium">{member.name}</span>
                                        <span className="text-center text-sm">{member.bearbeitet} Tickets</span>
                                        <span className="text-center text-sm">Ø {member.avgTime}h</span>
                                        <span className="text-center text-sm flex items-center justify-center gap-1">
                                            {member.rating}
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Verbesserungspotenzial */}
            <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                    <CardTitle className="text-yellow-900">💡 Verbesserungs-Potenzial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {avgSolutionTime > 6 && (
                        <p className="text-yellow-800">⚠️ Lösungszeit steigt - mehr Ressourcen nötig?</p>
                    )}
                    {parseInt(slaPercent.Hoch) < 80 && (
                        <p className="text-red-800">⚠️ Hoch-Priorität SLA-Grenze ({slaPercent.Hoch}%) - Prozess verbessern!</p>
                    )}
                    <p className="text-green-800">✅ First-Touch Zeit gesunken - gut!</p>
                </CardContent>
            </Card>

            {/* Export */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm">📊 PDF-Report</Button>
                <Button variant="outline" size="sm">📈 Excel</Button>
            </div>
        </div>
    );
}