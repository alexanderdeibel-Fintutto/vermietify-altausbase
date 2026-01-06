import React from 'react';
import { Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Kommunikation() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Kommunikation</h1>
                <p className="text-slate-600 mt-2">Verwalten Sie Ihre gesamte Kommunikation mit Mietern und Partnern</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>E-Mails</CardTitle>
                                <CardDescription>Posteingang verwalten</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600">
                            Alle eingehenden E-Mails zentral verwalten und automatisch Tasks erstellen lassen.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle>Nachrichten</CardTitle>
                                <CardDescription>Chat & SMS</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600">
                            Direkte Kommunikation mit Mietern über verschiedene Kanäle.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Send className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Versand</CardTitle>
                                <CardDescription>Dokumente senden</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600">
                            Dokumente und Mitteilungen an Mieter versenden.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Kommunikationsverlauf</CardTitle>
                    <CardDescription>Alle Kommunikationen im Überblick</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12 text-slate-500">
                        <div className="text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Kommunikationshistorie wird hier angezeigt</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}