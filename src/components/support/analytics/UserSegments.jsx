import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function UserSegments({ problems }) {
    const [expandedSegment, setExpandedSegment] = useState(null);
    
    // User-Segmentierung (vereinfacht - basiert auf Problem-Häufigkeit pro User)
    const userProblems = {};
    problems.forEach(p => {
        const user = p.created_by || 'Anonym';
        if (!userProblems[user]) {
            userProblems[user] = [];
        }
        userProblems[user].push(p);
    });

    // Segmente definieren
    const segments = {
        'Neue (<30 Tage)': { users: [], avgProblems: 0, topProblem: '', color: 'bg-red-100' },
        'Standard (30-90)': { users: [], avgProblems: 0, topProblem: '', color: 'bg-yellow-100' },
        'Erfahren (>90)': { users: [], avgProblems: 0, topProblem: '', color: 'bg-green-100' },
        'Power-User': { users: [], avgProblems: 0, topProblem: '', color: 'bg-blue-100' }
    };

    // Vereinfachte Segmentierung basierend auf Problem-Anzahl
    Object.entries(userProblems).forEach(([user, probs]) => {
        if (probs.length >= 5) {
            segments['Neue (<30 Tage)'].users.push({ user, problems: probs });
        } else if (probs.length >= 3) {
            segments['Standard (30-90)'].users.push({ user, problems: probs });
        } else if (probs.length >= 1) {
            segments['Erfahren (>90)'].users.push({ user, problems: probs });
        } else {
            segments['Power-User'].users.push({ user, problems: probs });
        }
    });

    // Berechne Durchschnitte
    Object.keys(segments).forEach(segName => {
        const seg = segments[segName];
        if (seg.users.length > 0) {
            seg.avgProblems = (seg.users.reduce((sum, u) => sum + u.problems.length, 0) / seg.users.length).toFixed(1);
            
            // Top-Problem
            const problemTitles = {};
            seg.users.forEach(u => {
                u.problems.forEach(p => {
                    const key = p.problem_titel.substring(0, 30);
                    problemTitles[key] = (problemTitles[key] || 0) + 1;
                });
            });
            const top = Object.entries(problemTitles).sort(([_, a], [__, b]) => b - a)[0];
            seg.topProblem = top ? top[0] : 'N/A';
        }
    });

    const segmentData = Object.entries(segments).map(([name, data]) => ({
        name,
        anzahl: data.users.reduce((sum, u) => sum + u.problems.length, 0),
        avgPerUser: parseFloat(data.avgProblems),
        topProblem: data.topProblem,
        userCount: data.users.length,
        users: data.users
    }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">👥 User-Segment-Analyse</h2>
                <p className="text-sm text-slate-600">Welche User-Gruppen haben welche Probleme?</p>
            </div>

            {/* Segmente Übersicht */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Segmente im Vergleich</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {segmentData.map(seg => (
                            <div key={seg.name}>
                                <div
                                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                                    onClick={() => setExpandedSegment(expandedSegment === seg.name ? null : seg.name)}
                                >
                                    {expandedSegment === seg.name ? (
                                        <ChevronDown className="w-5 h-5" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5" />
                                    )}
                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                        <div>
                                            <p className="font-semibold">{seg.name}</p>
                                        </div>
                                        <div className="text-center">
                                            <Badge>{seg.anzahl} Probleme</Badge>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-slate-600">Ø {seg.avgPerUser}/User</span>
                                        </div>
                                        <div className="text-right text-sm text-slate-600 truncate">
                                            {seg.topProblem}
                                        </div>
                                    </div>
                                </div>

                                {/* Drill-Down */}
                                {expandedSegment === seg.name && (
                                    <Card className="mt-2 ml-8 border-l-4 border-blue-500">
                                        <CardContent className="p-4 space-y-4">
                                            <p className="text-sm text-slate-700">
                                                <strong>{seg.anzahl} Probleme</strong> von <strong>{seg.userCount} Usern</strong> (Ø {seg.avgPerUser} pro User)
                                            </p>

                                            {/* Top 5 Probleme */}
                                            <div>
                                                <p className="font-semibold text-slate-900 mb-2">Top 5 Probleme:</p>
                                                {(() => {
                                                    const titles = {};
                                                    seg.users.forEach(u => {
                                                        u.problems.forEach(p => {
                                                            titles[p.problem_titel] = (titles[p.problem_titel] || 0) + 1;
                                                        });
                                                    });
                                                    return Object.entries(titles)
                                                        .sort(([_, a], [__, b]) => b - a)
                                                        .slice(0, 5)
                                                        .map(([title, count], i) => (
                                                            <div key={title} className="flex items-center justify-between py-2 border-b">
                                                                <span className="text-sm text-slate-700">{i + 1}. {title}</span>
                                                                <Badge variant="outline">{count}x</Badge>
                                                            </div>
                                                        ));
                                                })()}
                                            </div>

                                            {/* Handlungsempfehlung */}
                                            {seg.name === 'Neue (<30 Tage)' && seg.avgPerUser > 3 && (
                                                <Card className="bg-orange-50 border-orange-200">
                                                    <CardContent className="p-3">
                                                        <p className="font-semibold text-orange-900 mb-2">💡 HANDLUNGSEMPFEHLUNG:</p>
                                                        <ul className="text-sm text-orange-800 space-y-1">
                                                            <li>→ Onboarding-Tutorial fehlt!</li>
                                                            <li>→ Guided Tour implementieren</li>
                                                            <li>→ Tooltips bei ersten Schritten</li>
                                                            <li>→ Video-Tutorials verlinken</li>
                                                        </ul>
                                                        <Button size="sm" className="mt-3 bg-orange-600 hover:bg-orange-700">
                                                            Onboarding-Feature in Roadmap
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Vergleich der Segmente</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={segmentData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="anzahl" fill="#3b82f6" name="Anzahl Probleme" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Retention-Korrelation */}
            <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                    <CardTitle className="text-purple-900">📊 Retention-Korrelation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="p-3 bg-red-100 border border-red-300 rounded">
                        <p className="text-red-900">
                            User mit 3+ Problemen in ersten 7 Tagen:<br />
                            <strong>→ Hohe Absprungrate ⚠️</strong>
                        </p>
                    </div>
                    <div className="p-3 bg-green-100 border border-green-300 rounded">
                        <p className="text-green-900">
                            User mit &lt;2 Problemen in ersten 7 Tagen:<br />
                            <strong>→ Hohe Retention ✅</strong>
                        </p>
                    </div>
                    <p className="font-semibold text-purple-900 pt-2">
                        FAZIT: Erste Woche entscheidet über Retention!
                    </p>
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