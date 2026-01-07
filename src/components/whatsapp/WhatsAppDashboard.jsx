import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    MessageSquare, Send, CheckCheck, AlertCircle, 
    TrendingUp, Users, Euro, Clock 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

export default function WhatsAppDashboard({ accountId }) {
    const { data: nachrichten = [] } = useQuery({
        queryKey: ['whatsapp-messages-all', accountId],
        queryFn: () => base44.entities.WhatsAppMessage.filter({ 
            whatsapp_account_id: accountId 
        })
    });

    const { data: kontakte = [] } = useQuery({
        queryKey: ['whatsapp-contacts-all', accountId],
        queryFn: () => base44.entities.WhatsAppContact.filter({ 
            whatsapp_account_id: accountId 
        })
    });

    const { data: account } = useQuery({
        queryKey: ['whatsapp-account', accountId],
        queryFn: () => base44.entities.WhatsAppAccount.filter({ id: accountId })
    });

    const currentAccount = account?.[0];

    // Statistiken berechnen
    const stats = {
        total: nachrichten.length,
        gesendet: nachrichten.filter(m => m.richtung === 'ausgehend').length,
        empfangen: nachrichten.filter(m => m.richtung === 'eingehend').length,
        gelesen: nachrichten.filter(m => m.status === 'gelesen').length,
        fehler: nachrichten.filter(m => m.status === 'fehler').length,
        gesamtkosten: nachrichten.reduce((sum, m) => sum + (m.kosten_euro || 0), 0),
        kontakteGesamt: kontakte.length,
        kontakteOptIn: kontakte.filter(k => k.opt_in_status === 'erteilt').length
    };

    // Zeitreihen-Daten für Chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59);

        const dayMessages = nachrichten.filter(m => {
            const msgDate = new Date(m.created_date);
            return msgDate >= dayStart && msgDate <= dayEnd;
        });

        return {
            datum: format(date, 'dd.MM', { locale: de }),
            gesendet: dayMessages.filter(m => m.richtung === 'ausgehend').length,
            empfangen: dayMessages.filter(m => m.richtung === 'eingehend').length
        };
    });

    // Kategorie-Verteilung
    const kategorieData = [
        { name: 'Service', wert: nachrichten.filter(m => m.kategorie === 'service').length },
        { name: 'Utility', wert: nachrichten.filter(m => m.kategorie === 'utility').length },
        { name: 'Marketing', wert: nachrichten.filter(m => m.kategorie === 'marketing').length },
        { name: 'Auth', wert: nachrichten.filter(m => m.kategorie === 'authentication').length }
    ].filter(d => d.wert > 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-slate-600">Nachrichten gesamt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Send className="w-8 h-8 text-emerald-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.gesendet}</p>
                                <p className="text-xs text-slate-600">Gesendet</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCheck className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.gelesen}</p>
                                <p className="text-xs text-slate-600">Gelesen</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Euro className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.gesamtkosten.toFixed(2)}€</p>
                                <p className="text-xs text-slate-600">Gesamtkosten</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.kontakteOptIn}/{stats.kontakteGesamt}</p>
                                <p className="text-xs text-slate-600">Kontakte mit Einwilligung</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {stats.fehler > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.fehler}</p>
                                    <p className="text-xs text-slate-600">Fehlgeschlagene Nachrichten</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Nachrichten-Verlauf (7 Tage)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={last7Days}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="datum" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="gesendet" stroke="#10b981" strokeWidth={2} name="Gesendet" />
                            <Line type="monotone" dataKey="empfangen" stroke="#3b82f6" strokeWidth={2} name="Empfangen" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {kategorieData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Nachrichten nach Kategorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={kategorieData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="wert" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {currentAccount && (
                <Card>
                    <CardHeader>
                        <CardTitle>Budget & Verbrauch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Aktueller Verbrauch</span>
                                <span className="font-bold">{currentAccount.aktueller_verbrauch?.toFixed(2) || '0.00'}€</span>
                            </div>
                            {currentAccount.monatliches_budget && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Monatliches Budget</span>
                                        <span className="font-bold">{currentAccount.monatliches_budget.toFixed(2)}€</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div 
                                            className="bg-emerald-600 h-2 rounded-full"
                                            style={{ 
                                                width: `${Math.min((currentAccount.aktueller_verbrauch / currentAccount.monatliches_budget) * 100, 100)}%` 
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Noch verfügbar: {(currentAccount.monatliches_budget - currentAccount.aktueller_verbrauch).toFixed(2)}€
                                    </p>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}