import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy, TrendingUp, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeamPerformance({ problems }) {
    const [expandedMember, setExpandedMember] = useState(null);
    
    // Team-Statistiken
    const teamStats = {};
    problems.forEach(p => {
        if (p.bearbeiter_email) {
            if (!teamStats[p.bearbeiter_email]) {
                teamStats[p.bearbeiter_email] = {
                    tickets: 0,
                    times: [],
                    ratings: [],
                    categories: {}
                };
            }
            teamStats[p.bearbeiter_email].tickets++;
            if (p.loesungszeit_stunden) teamStats[p.bearbeiter_email].times.push(p.loesungszeit_stunden);
            if (p.user_zufriedenheit) teamStats[p.bearbeiter_email].ratings.push(p.user_zufriedenheit);
            
            const cat = p.betroffenes_modul || p.kategorie;
            if (cat) {
                teamStats[p.bearbeiter_email].categories[cat] = (teamStats[p.bearbeiter_email].categories[cat] || 0) + 1;
            }
        }
    });

    const teamData = Object.entries(teamStats).map(([email, data]) => ({
        email,
        name: email.split('@')[0],
        tickets: data.tickets,
        avgTime: data.times.length > 0 ? (data.times.reduce((a, b) => a + b, 0) / data.times.length).toFixed(1) : 0,
        rating: data.ratings.length > 0 ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1) : 0,
        qualitat: data.ratings.length > 0 ? ((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) / 5 * 100).toFixed(0) : 0,
        categories: data.categories
    })).sort((a, b) => b.tickets - a.tickets);

    // Wissens-Matrix
    const allCategories = [...new Set(problems.map(p => p.betroffenes_modul || p.kategorie).filter(Boolean))].slice(0, 6);

    // This Week's Achievements
    const thisWeek = problems.filter(p => {
        if (!p.created_date) return false;
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return new Date(p.created_date) > new Date(weekAgo);
    });

    const fastestSolver = teamData.reduce((min, t) => 
        parseFloat(t.avgTime) > 0 && (!min || parseFloat(t.avgTime) < parseFloat(min.avgTime)) ? t : min
    , null);
    
    const bestRated = teamData.reduce((max, t) => 
        parseFloat(t.rating) > 0 && (!max || parseFloat(t.rating) > parseFloat(max.rating)) ? t : max
    , null);
    
    const mostTickets = teamData[0];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">👨‍💻 Team-Performance</h2>
                <p className="text-sm text-slate-600">Wie performt das Support-Team?</p>
            </div>

            {/* Team-Übersicht */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Team-Übersicht</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {teamData.map(member => (
                            <div key={member.email}>
                                <div
                                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                                    onClick={() => setExpandedMember(expandedMember === member.email ? null : member.email)}
                                >
                                    {expandedMember === member.email ? (
                                        <ChevronDown className="w-5 h-5" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5" />
                                    )}
                                    <div className="flex-1 grid grid-cols-5 gap-4">
                                        <span className="font-semibold">{member.name}</span>
                                        <span className="text-center text-sm">{member.tickets} Tickets</span>
                                        <span className="text-center text-sm">Ø {member.avgTime}h</span>
                                        <span className="text-center text-sm flex items-center justify-center gap-1">
                                            {member.rating}
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        </span>
                                        <div className="flex items-center justify-end">
                                            <Progress value={parseInt(member.qualitat)} className="w-20 h-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Drill-Down */}
                                {expandedMember === member.email && (
                                    <Card className="mt-2 ml-8 border-l-4 border-purple-500">
                                        <CardContent className="p-4 space-y-4">
                                            <div>
                                                <p className="font-semibold text-slate-900 mb-2">{member.name}:</p>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <p className="font-medium text-green-700">✅ Stärken:</p>
                                                        <ul className="ml-4 text-slate-600 space-y-1">
                                                            {parseFloat(member.avgTime) < 4 && <li>• Schnelle Lösungszeit ({member.avgTime}h)</li>}
                                                            {parseFloat(member.rating) >= 4.3 && <li>• Exzellente User-Bewertung ({member.rating}⭐)</li>}
                                                            {Object.entries(member.categories).sort(([_, a], [__, b]) => b - a)[0] && (
                                                                <li>• Spezialist für {Object.entries(member.categories).sort(([_, a], [__, b]) => b - a)[0][0]}</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    {parseFloat(member.avgTime) > 5 && (
                                                        <div>
                                                            <p className="font-medium text-orange-700">⚠️ Entwicklungsbereiche:</p>
                                                            <ul className="ml-4 text-slate-600">
                                                                <li>• Lösungszeit könnte verbessert werden</li>
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button size="sm" variant="outline">Individuelle Auswertung</Button>
                                                <Button size="sm" variant="outline">1:1 Meeting-Vorlage</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Wissens-Verteilung */}
            <Card>
                <CardHeader>
                    <CardTitle>🎓 Wissens-Verteilung</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left">Modul/Kategorie</th>
                                    {teamData.slice(0, 3).map(m => (
                                        <th key={m.email} className="p-2 text-center">{m.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allCategories.map(cat => (
                                    <tr key={cat} className="border-b">
                                        <td className="p-2 font-medium">{cat}</td>
                                        {teamData.slice(0, 3).map(m => {
                                            const count = m.categories[cat] || 0;
                                            const level = count >= 10 ? 3 : count >= 5 ? 2 : count > 0 ? 1 : 0;
                                            return (
                                                <td key={m.email} className="p-2 text-center">
                                                    {'★'.repeat(level)}{'☆'.repeat(3 - level)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Empfehlungen */}
            <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                    <CardTitle className="text-purple-900">💡 Empfehlungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-purple-800">
                    <p>• Cross-Training: Wissen breiter verteilen</p>
                    <p>• Mentoring: Erfahrene unterstützen Neue</p>
                    <p>• Spezialisierung nutzen bei Ticket-Zuweisung</p>
                </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-2 border-yellow-300 bg-yellow-50">
                <CardHeader>
                    <CardTitle className="text-yellow-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        🏆 Achievements (Diese Woche)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {fastestSolver && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded border border-yellow-200">
                            <span className="text-2xl">🥇</span>
                            <div className="flex-1">
                                <p className="font-semibold">Schnellste Lösung: {fastestSolver.name}</p>
                                <p className="text-sm text-slate-600">{fastestSolver.avgTime}h Durchschnitt</p>
                            </div>
                        </div>
                    )}
                    {bestRated && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded border border-yellow-200">
                            <span className="text-2xl">🥇</span>
                            <div className="flex-1">
                                <p className="font-semibold">Beste Bewertung: {bestRated.name}</p>
                                <p className="text-sm text-slate-600">{bestRated.rating}⭐ Durchschnitt</p>
                            </div>
                        </div>
                    )}
                    {mostTickets && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded border border-yellow-200">
                            <span className="text-2xl">🥇</span>
                            <div className="flex-1">
                                <p className="font-semibold">Meiste Tickets: {mostTickets.name}</p>
                                <p className="text-sm text-slate-600">{mostTickets.tickets} bearbeitet</p>
                            </div>
                        </div>
                    )}
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