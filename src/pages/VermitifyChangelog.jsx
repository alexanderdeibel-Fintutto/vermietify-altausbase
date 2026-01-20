import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Bug, Shield } from 'lucide-react';

const changelogEntries = [
    {
        version: 'v2.1.0',
        date: '15.01.2024',
        changes: [
            { type: 'feature', text: 'KI-gestützte Dokumentenerkennung für Rechnungen' },
            { type: 'feature', text: 'Neuer Mietvertrag-Generator mit erweiterten Optionen' },
            { type: 'improvement', text: 'Verbesserte Performance bei großen Datenmengen' },
            { type: 'fix', text: 'Behoben: Fehler bei BK-Abrechnung mit 0% Leerstand' }
        ]
    },
    {
        version: 'v2.0.0',
        date: '01.01.2024',
        changes: [
            { type: 'feature', text: 'Komplette Neugestaltung der Benutzeroberfläche' },
            { type: 'feature', text: 'Mobile-First Design mit optimierter Touch-Bedienung' },
            { type: 'feature', text: 'Neues Dashboard mit anpassbaren Widgets' },
            { type: 'security', text: 'Erweiterte Zwei-Faktor-Authentifizierung' }
        ]
    },
    {
        version: 'v1.9.5',
        date: '20.12.2023',
        changes: [
            { type: 'improvement', text: 'Schnellerer PDF-Export für Dokumente' },
            { type: 'feature', text: 'Bulk-Operationen für Mieter und Verträge' },
            { type: 'fix', text: 'Behoben: Darstellungsfehler in Safari' }
        ]
    },
    {
        version: 'v1.9.0',
        date: '10.12.2023',
        changes: [
            { type: 'feature', text: 'WhatsApp-Benachrichtigungen für Mieter' },
            { type: 'feature', text: 'Automatische Mahnungen bei Zahlungsverzug' },
            { type: 'improvement', text: 'Optimierte Ladezeiten um 40%' }
        ]
    }
];

const typeConfig = {
    feature: { icon: Sparkles, label: 'Neu', color: 'vf-badge-success' },
    improvement: { icon: Zap, label: 'Verbessert', color: 'vf-badge-info' },
    fix: { icon: Bug, label: 'Bugfix', color: 'vf-badge-warning' },
    security: { icon: Shield, label: 'Sicherheit', color: 'vf-badge-error' }
};

export default function VermitifyChangelog() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Changelog
                    </h1>
                    <p className="text-xl text-gray-600">
                        Alle Updates und Verbesserungen im Überblick
                    </p>
                </div>
            </div>

            {/* Changelog */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="space-y-8">
                    {changelogEntries.map((entry, idx) => (
                        <div key={idx} className="border-l-4 border-blue-600 pl-6">
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-2xl font-bold">{entry.version}</h2>
                                <span className="text-gray-500">{entry.date}</span>
                            </div>
                            
                            <div className="space-y-3">
                                {entry.changes.map((change, i) => {
                                    const config = typeConfig[change.type];
                                    const Icon = config.icon;
                                    
                                    return (
                                        <div key={i} className="flex items-start gap-3">
                                            <Badge className={config.color}>
                                                <Icon className="w-3 h-3 mr-1" />
                                                {config.label}
                                            </Badge>
                                            <span className="text-gray-700">{change.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}