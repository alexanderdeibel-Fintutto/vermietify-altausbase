import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle, Search, MessageSquare, BookOpen, Video, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Help() {
    const [searchTerm, setSearchTerm] = useState('');

    const faqs = [
        {
            category: 'Allgemein',
            items: [
                { q: 'Wie erstelle ich ein Gebäude?', a: 'Navigiere zu Gebäude > Neues Gebäude und fülle die erforderlichen Informationen aus.' },
                { q: 'Wie verwalte ich Mieter?', a: 'Gehe zu Mieter > Übersicht, um eine Liste aller Mieter zu sehen.' },
                { q: 'Wie kann ich einen Bericht exportieren?', a: 'Klicke auf das Download-Symbol neben dem Bericht, um ihn als PDF zu exportieren.' }
            ]
        },
        {
            category: 'Finanzen',
            items: [
                { q: 'Wie tracking ich Zahlungen?', a: 'Verwende die Zahlungsverwaltung um alle Zahlungen zu verfolgen.' },
                { q: 'Wie erstelle ich eine Nebenkostenabrechnung?', a: 'Gehe zu Nebenkosten > Neue Abrechnung und folge dem Wizard.' }
            ]
        }
    ];

    const resources = [
        { icon: BookOpen, title: 'Dokumentation', desc: 'Umfassende Benutzerhandbuch' },
        { icon: Video, title: 'Video Tutorials', desc: 'Schritt-für-Schritt Video-Anleitungen' },
        { icon: MessageSquare, title: 'Community Forum', desc: 'Fragen stellen und Tipps austauschen' },
        { icon: Mail, title: 'Support kontaktieren', desc: 'E-Mail an unser Support-Team' }
    ];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Hilfe & Support</h1>
                    <p className="vf-page-subtitle">Finde Antworten auf deine Fragen</p>
                </div>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-orange-50 border-blue-100">
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Suche nach Hilfe..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-4 gap-4">
                {resources.map((res, idx) => {
                    const Icon = res.icon;
                    return (
                        <Card key={idx} className="cursor-pointer hover:shadow-lg transition">
                            <CardContent className="p-6 text-center">
                                <Icon className="w-8 h-8 mx-auto text-blue-600 mb-3" />
                                <h3 className="font-semibold text-sm mb-1">{res.title}</h3>
                                <p className="text-xs text-gray-600">{res.desc}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="space-y-4">
                {faqs.map((category, idx) => (
                    <Card key={idx}>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">{category.category}</h3>
                            <div className="space-y-3">
                                {category.items.map((faq, faqIdx) => (
                                    <details key={faqIdx} className="p-3 bg-gray-50 rounded-lg border cursor-pointer">
                                        <summary className="font-semibold text-sm flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4" />
                                            {faq.q}
                                        </summary>
                                        <p className="text-sm text-gray-600 mt-3 ml-6">{faq.a}</p>
                                    </details>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">Noch mehr Hilfe benötigt?</h3>
                    <p className="text-gray-600 mb-4">Unser Support-Team ist bereit, dir zu helfen. Kontaktiere uns jederzeit.</p>
                    <Button className="vf-btn-primary">Support kontaktieren</Button>
                </CardContent>
            </Card>
        </div>
    );
}