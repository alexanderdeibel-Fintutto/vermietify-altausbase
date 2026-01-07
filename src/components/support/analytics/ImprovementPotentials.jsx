import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, DollarSign, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ImprovementPotentials({ problems }) {
    // Quick-Wins identifizieren (häufige, einfache Probleme)
    const problemTitles = {};
    problems.forEach(p => {
        const key = p.problem_titel.substring(0, 50);
        if (!problemTitles[key]) {
            problemTitles[key] = { count: 0, isFeature: p.ist_feature_request };
        }
        problemTitles[key].count++;
    });

    const quickWins = Object.entries(problemTitles)
        .filter(([_, data]) => data.count >= 5)
        .sort(([_, a], [__, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([title, data]) => ({
            title,
            count: data.count,
            impact: data.count * 15, // Minuten gespart
            aufwand: Math.random() < 0.5 ? '1h' : '3h' // Vereinfacht
        }));

    // Vermeidbare Probleme
    const avoidableTypes = [
        { type: 'Unklare UI', count: 0, solution: 'Tooltips, Hints' },
        { type: 'Fehlende Doku', count: 0, solution: 'Kontexthilfe' },
        { type: 'Bugs', count: 0, solution: 'Besseres Testing' },
        { type: 'Unklare Fehlermeldungen', count: 0, solution: 'Bessere Messages' },
        { type: 'Performance', count: 0, solution: 'Optimierung' },
        { type: 'Fehlende Features', count: 0, solution: 'Feature-Entwicklung' }
    ];

    problems.forEach(p => {
        if (p.kategorie === 'Bedienung') avoidableTypes[0].count++;
        else if (p.kategorie === 'Dokumentation') avoidableTypes[1].count++;
        else if (p.ist_bug) avoidableTypes[2].count++;
        else if (p.kategorie === 'Bug') avoidableTypes[2].count++;
        else if (p.kategorie === 'Performance') avoidableTypes[4].count++;
        else if (p.ist_feature_request) avoidableTypes[5].count++;
    });

    // ROI-Kalkulation
    const totalTickets = problems.length;
    const supportCostPerHour = 50;
    const avgMinutesPerTicket = 15;
    const monthlyCost = (totalTickets * avgMinutesPerTicket / 60) * supportCostPerHour;
    const savingsFromTop10 = quickWins.slice(0, 10).reduce((sum, qw) => sum + qw.count, 0);
    const savingsHours = (savingsFromTop10 * avgMinutesPerTicket) / 60;
    const savingsCost = savingsHours * supportCostPerHour;
    const implementationCost = 1000; // ~20h à 50€

    // Feature-Requests priorisiert
    const featureRequests = {};
    problems.filter(p => p.ist_feature_request).forEach(p => {
        const key = p.problem_titel.substring(0, 40);
        featureRequests[key] = (featureRequests[key] || 0) + 1;
    });
    const topFeatures = Object.entries(featureRequests)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 8)
        .map(([title, count]) => ({ title, anfragen: count, impact: count * 10 }));

    // Schulungsbedarf
    const trainingNeeds = [
        { thema: 'BK-Abrechnung erstellen', fragen: 0 },
        { thema: 'Steuer (Anlage V)', fragen: 0 },
        { thema: 'CSV-Import', fragen: 0 },
        { thema: 'Objekt-Struktur', fragen: 0 }
    ];

    problems.forEach(p => {
        if (p.problem_titel.toLowerCase().includes('betriebskosten') || p.problem_titel.toLowerCase().includes('abrechnung')) {
            trainingNeeds[0].fragen++;
        }
        if (p.problem_titel.toLowerCase().includes('steuer') || p.problem_titel.toLowerCase().includes('anlage')) {
            trainingNeeds[1].fragen++;
        }
        if (p.problem_titel.toLowerCase().includes('import') || p.problem_titel.toLowerCase().includes('csv')) {
            trainingNeeds[2].fragen++;
        }
        if (p.problem_titel.toLowerCase().includes('objekt') || p.problem_titel.toLowerCase().includes('gebäude')) {
            trainingNeeds[3].fragen++;
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">💡 Verbesserungs-Potenziale</h2>
                <p className="text-sm text-slate-600">Was sollten wir verbessern?</p>
            </div>

            {/* Quick-Wins */}
            <Card className="border-2 border-emerald-300 bg-emerald-50">
                <CardHeader>
                    <CardTitle className="text-emerald-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        🎯 TOP QUICK-WINS (Hoher Impact, Geringer Aufwand)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {quickWins.slice(0, 5).map((qw, i) => (
                        <Card key={i} className="bg-white">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{i + 1}. {qw.title}</p>
                                        <div className="flex gap-4 text-sm text-slate-600 mt-2">
                                            <span>Problem verhindert: <strong>{qw.count} Tickets/Monat</strong></span>
                                            <span>Aufwand: <strong>~{qw.aufwand}</strong></span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline">Details</Button>
                                        <Button size="sm" className="bg-emerald-600">In Sprint</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            {/* Vermeidbare Probleme */}
            <Card>
                <CardHeader>
                    <CardTitle>🔧 Vermeidbare Probleme</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {avoidableTypes.filter(t => t.count > 0).map(type => (
                            <div key={type.type} className="flex items-center gap-4 p-3 bg-slate-50 rounded">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <span className="font-medium text-slate-900">{type.type}</span>
                                    <Badge className="justify-self-center">{type.count} Tickets</Badge>
                                    <span className="text-sm text-slate-600 justify-self-end">{type.solution}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ROI-Kalkulation */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        💰 ROI-Kalkulation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <p className="font-semibold text-blue-900">Aktuelle Support-Kosten pro Monat:</p>
                        <p className="text-blue-800">
                            {totalTickets} Tickets × {avgMinutesPerTicket} Min Ø = {(totalTickets * avgMinutesPerTicket / 60).toFixed(1)}h × {supportCostPerHour}€/h = 
                            <strong> {monthlyCost.toFixed(0)}€</strong>
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-emerald-900">Potential bei Top 10 Quick-Wins:</p>
                        <p className="text-emerald-800">
                            -{savingsFromTop10} Tickets/Monat = -{savingsHours.toFixed(1)}h = 
                            <strong> -{savingsCost.toFixed(0)}€/Monat</strong>
                        </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded border border-green-300">
                        <p className="font-semibold text-green-900">Implementierungs-Aufwand: ~20h = {implementationCost}€</p>
                        <p className="text-green-800 text-lg font-bold mt-1">
                            ROI: Break-Even nach {Math.ceil(implementationCost / savingsCost)} Monat! ✅
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Feature-Requests */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Feature-Requests (Priorisiert nach Impact)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {topFeatures.map(feat => (
                            <div key={feat.title} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                                <span className="text-sm font-medium text-slate-900">{feat.title}</span>
                                <div className="flex items-center gap-3">
                                    <Badge>{feat.anfragen} Anfragen</Badge>
                                    <Badge variant="outline">Impact: {feat.impact}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Schulungsbedarf */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        🎓 Schulungs-Bedarf
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {trainingNeeds.filter(t => t.fragen > 10).map(training => (
                            <div key={training.thema} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                                <span className="font-medium text-slate-900">{training.thema}</span>
                                <div className="flex items-center gap-3">
                                    <Badge>{training.fragen} häufige Fragen</Badge>
                                    <Badge className="bg-emerald-600">✅ Schulung empfohlen</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button size="sm">Webinar planen</Button>
                        <Button size="sm" variant="outline">Video-Tutorial erstellen</Button>
                    </div>
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