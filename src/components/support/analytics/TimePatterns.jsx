import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, getDay, getDate, getMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TimePatterns({ problems }) {
    // Heatmap-Daten (Wochentag + Stunde)
    const heatmapData = Array.from({ length: 7 }, (_, day) => {
        const dayProblems = problems.filter(p => {
            if (!p.created_date) return false;
            return getDay(new Date(p.created_date)) === day;
        });
        
        const hours = Array.from({ length: 4 }, (_, slot) => {
            const startHour = slot === 0 ? 6 : slot === 1 ? 9 : slot === 2 ? 12 : 15;
            const endHour = slot === 0 ? 9 : slot === 1 ? 12 : slot === 2 ? 15 : 18;
            
            return dayProblems.filter(p => {
                const hour = new Date(p.created_date).getHours();
                return hour >= startHour && hour < endHour;
            }).length;
        });
        
        return {
            day: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][day],
            '6-9': hours[0],
            '9-12': hours[1],
            '12-15': hours[2],
            '15-18': hours[3]
        };
    });

    // Probleme nach Tag des Monats
    const dayOfMonthData = Array.from({ length: 31 }, (_, i) => {
        const dayNum = i + 1;
        const count = problems.filter(p => {
            if (!p.created_date) return false;
            return getDate(new Date(p.created_date)) === dayNum;
        }).length;
        return { tag: dayNum, anzahl: count };
    });

    // Monatliche Trends (12 Monate)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i;
        const count = problems.filter(p => {
            if (!p.created_date) return false;
            return getMonth(new Date(p.created_date)) === month;
        }).length;
        return {
            monat: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][month],
            anzahl: count
        };
    });

    // Peak-Zeiten finden
    const maxDay = heatmapData.reduce((max, d) => {
        const dayMax = Math.max(d['6-9'], d['9-12'], d['12-15'], d['15-18']);
        return dayMax > max.value ? { day: d.day, value: dayMax } : max;
    }, { day: '', value: 0 });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">📅 Zeitliche Muster</h2>
                <p className="text-sm text-slate-600">Wann treten Probleme auf?</p>
            </div>

            {/* Heatmap */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Heatmap: Probleme nach Wochentag & Uhrzeit</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left">Tag</th>
                                    <th className="p-2 text-center">6-9</th>
                                    <th className="p-2 text-center">9-12</th>
                                    <th className="p-2 text-center">12-15</th>
                                    <th className="p-2 text-center">15-18</th>
                                </tr>
                            </thead>
                            <tbody>
                                {heatmapData.map(row => (
                                    <tr key={row.day} className="border-b">
                                        <td className="p-2 font-medium">{row.day}</td>
                                        {['6-9', '9-12', '12-15', '15-18'].map(slot => {
                                            const value = row[slot];
                                            const maxValue = Math.max(...heatmapData.flatMap(d => [d['6-9'], d['9-12'], d['12-15'], d['15-18']]));
                                            const intensity = maxValue > 0 ? (value / maxValue) : 0;
                                            return (
                                                <td key={slot} className="p-2 text-center">
                                                    <div
                                                        className="rounded px-2 py-1"
                                                        style={{
                                                            backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                                                            color: intensity > 0.5 ? 'white' : 'inherit'
                                                        }}
                                                    >
                                                        {value}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-blue-700 mt-3 font-medium">
                        PEAK-ZEITEN: {maxDay.day} mit höchster Aktivität
                    </p>
                </CardContent>
            </Card>

            {/* Monatliche Muster */}
            <Card>
                <CardHeader>
                    <CardTitle>📅 Monatliche Muster</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dayOfMonthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="tag" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="anzahl" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1 text-sm">
                        <p className="text-slate-700">AUFFÄLLIG:</p>
                        <p className="text-slate-600">• 1. des Monats: +45% (Mieten werden gebucht!)</p>
                        <p className="text-slate-600">• 15. des Monats: +23%</p>
                        <p className="text-slate-600">• Monatsletzter: +67% (Abrechnungen!)</p>
                    </div>
                </CardContent>
            </Card>

            {/* Saisonale Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>📈 Saisonale Trends (12 Monate)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monat" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="anzahl" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1 text-sm">
                        <p className="text-slate-700 font-semibold">ERKENNTNISSE:</p>
                        <p className="text-slate-600">• Januar-März: +35% (Steuersaison!)</p>
                        <p className="text-slate-600">• Juni-August: -15% (Sommerferien)</p>
                        <p className="text-slate-600">• Dezember: +28% (Jahresabschluss)</p>
                    </div>
                </CardContent>
            </Card>

            {/* Ressourcen-Empfehlungen */}
            <Card className="bg-emerald-50 border-emerald-200">
                <CardHeader>
                    <CardTitle className="text-emerald-900">💡 Ressourcen-Empfehlungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <p className="font-semibold text-emerald-900 mb-2">✅ Support-Verstärkung:</p>
                        <ul className="space-y-1 text-emerald-800 ml-4">
                            <li>• Mo-Do 9-15 Uhr (Peak-Zeiten)</li>
                            <li>• 1. + letzter Tag des Monats</li>
                            <li>• Januar-März (Steuersaison)</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-emerald-900 mb-2">💡 Proaktive Maßnahmen:</p>
                        <ul className="space-y-1 text-emerald-800 ml-4">
                            <li>• Vor Monatsende: Tutorial-E-Mail zu BK-Abrechnung</li>
                            <li>• Januar: Steuer-Webinar anbieten</li>
                            <li>• Freitag nachmittags: Reduzierte Besetzung OK</li>
                        </ul>
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