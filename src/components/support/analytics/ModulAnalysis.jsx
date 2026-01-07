import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ModulAnalysis({ problems }) {
    const [expandedModule, setExpandedModule] = useState(null);
    const [timeframe, setTimeframe] = useState('30');
    
    const cutoffDate = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000).toISOString();
    const filteredProblems = problems.filter(p => p.created_date >= cutoffDate);
    
    // Module gruppieren
    const modules = {};
    filteredProblems.forEach(p => {
        const mod = p.betroffenes_modul || 'Nicht zugeordnet';
        if (!modules[mod]) {
            modules[mod] = { total: 0, kritisch: 0, times: [], problems: [] };
        }
        modules[mod].total++;
        if (p.schweregrad === 'Kritisch') modules[mod].kritisch++;
        if (p.loesungszeit_stunden) modules[mod].times.push(p.loesungszeit_stunden);
        modules[mod].problems.push(p);
    });
    
    const moduleData = Object.entries(modules).map(([name, data]) => ({
        name,
        anzahl: data.total,
        kritisch: data.kritisch,
        avgTime: data.times.length > 0 ? (data.times.reduce((a, b) => a + b, 0) / data.times.length).toFixed(1) : 0,
        problems: data.problems
    })).sort((a, b) => b.anzahl - a.anzahl);

    const toggleModule = (moduleName) => {
        setExpandedModule(expandedModule === moduleName ? null : moduleName);
    };

    return (
        <div className="space-y-6">
            {/* Header mit Filter */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">🎯 Modul-Analyse</h2>
                    <p className="text-sm text-slate-600">Welche Module machen die meisten Probleme?</p>
                </div>
                <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Letzte 7 Tage</SelectItem>
                        <SelectItem value="30">Letzte 30 Tage</SelectItem>
                        <SelectItem value="90">Letzte 90 Tage</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Module-Tabelle */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Probleme pro Modul</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {moduleData.map((mod, index) => (
                            <div key={mod.name}>
                                <div
                                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                                    onClick={() => toggleModule(mod.name)}
                                >
                                    {expandedModule === mod.name ? (
                                        <ChevronDown className="w-5 h-5 text-slate-600" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-slate-600" />
                                    )}
                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                        <div>
                                            <p className="font-semibold text-slate-900">{mod.name}</p>
                                        </div>
                                        <div className="text-center">
                                            <Badge className="bg-blue-600">{mod.anzahl} Tickets</Badge>
                                        </div>
                                        <div className="text-center">
                                            {mod.kritisch > 0 && (
                                                <Badge className="bg-red-600">{mod.kritisch} Kritisch</Badge>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm text-slate-600">Ø {mod.avgTime}h</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Drill-Down */}
                                {expandedModule === mod.name && (
                                    <Card className="mt-2 ml-8 border-l-4 border-emerald-500">
                                        <CardContent className="p-4 space-y-4">
                                            {/* Problem-Kategorien */}
                                            <div>
                                                <p className="font-semibold text-slate-900 mb-2">Problem-Kategorien in diesem Modul:</p>
                                                {(() => {
                                                    const categories = {};
                                                    mod.problems.forEach(p => {
                                                        const title = p.problem_titel.substring(0, 50);
                                                        categories[title] = (categories[title] || 0) + 1;
                                                    });
                                                    return Object.entries(categories)
                                                        .sort(([_, a], [__, b]) => b - a)
                                                        .slice(0, 5)
                                                        .map(([title, count]) => (
                                                            <div key={title} className="flex items-center justify-between py-2 border-b">
                                                                <span className="text-sm text-slate-700">• {title}</span>
                                                                <Badge variant="outline">{count}x</Badge>
                                                            </div>
                                                        ));
                                                })()}
                                            </div>

                                            {/* Feature-Requests */}
                                            {(() => {
                                                const featureReqs = mod.problems.filter(p => p.ist_feature_request);
                                                if (featureReqs.length === 0) return null;
                                                return (
                                                    <div>
                                                        <p className="font-semibold text-slate-900 mb-2">Feature-Requests für dieses Modul:</p>
                                                        {featureReqs.slice(0, 3).map(p => (
                                                            <div key={p.id} className="text-sm text-slate-700 py-1">
                                                                • {p.problem_titel}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button size="sm" variant="outline">
                                                    Bug-Report erstellen
                                                </Button>
                                                <Button size="sm" variant="outline">
                                                    In Roadmap aufnehmen
                                                </Button>
                                            </div>
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
                    <CardTitle>📊 Vergleich der Module</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={moduleData.slice(0, 8)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip />
                            <Bar dataKey="anzahl" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Empfehlungen */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900">💡 KI-Empfehlungen</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        {moduleData[0] && moduleData[0].anzahl > 20 && (
                            <p className="text-blue-800">
                                🔴 DRINGEND: "{moduleData[0].name}" hat die meisten Probleme ({moduleData[0].anzahl}) - 
                                Ursache identifizieren (Bug? UX? Dokumentation?)
                            </p>
                        )}
                        {moduleData[0]?.kritisch > 3 && (
                            <p className="text-red-800">
                                ⚠️ KRITISCH: {moduleData[0].kritisch} kritische Probleme in "{moduleData[0].name}" - 
                                Sofortige Entwickler-Aufmerksamkeit erforderlich!
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Export */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm">📊 PDF-Report</Button>
                <Button variant="outline" size="sm">📈 Excel</Button>
                <Button variant="outline" size="sm">📧 An Entwicklung senden</Button>
            </div>
        </div>
    );
}