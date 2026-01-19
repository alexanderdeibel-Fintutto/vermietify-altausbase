import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Users, FileText, BarChart3, Calculator, Zap, Shield, 
    Mail, Calendar, CreditCard, Building2, CheckCircle, TrendingUp 
} from 'lucide-react';

const features = [
    {
        icon: Building2,
        title: 'Gebäudeverwaltung',
        description: 'Verwalten Sie unbegrenzt viele Gebäude mit allen Details, Grundbuchdaten und Eigentümern.',
        items: ['Gebäudestammdaten', 'Einheitenverwaltung', 'Grundbuch-Integration', 'Foto-Galerie']
    },
    {
        icon: Users,
        title: 'Mieterverwaltung',
        description: 'Alle Mieterdaten zentral erfasst. Verträge, Zahlungen und Kommunikation im Überblick.',
        items: ['Mieter-Stammdaten', 'Vertragsmanagement', 'Zahlungsverlauf', 'Kommunikations-Log']
    },
    {
        icon: FileText,
        title: 'Dokumentenmanagement',
        description: 'Digitale Dokumentenverwaltung mit automatischer Generierung von Verträgen und Schreiben.',
        items: ['Vertrags-Generator', 'Vorlagen-Bibliothek', 'OCR-Erkennung', 'Versionierung']
    },
    {
        icon: CreditCard,
        title: 'Finanzverwaltung',
        description: 'Vollständige Übersicht über Einnahmen, Ausgaben und Cashflow Ihrer Immobilien.',
        items: ['Mietzahlungen', 'Rechnungen', 'Bank-Integration', 'Cashflow-Analyse']
    },
    {
        icon: Calculator,
        title: 'Betriebskosten',
        description: 'Automatisierte Betriebskostenabrechnung nach BetrKV mit allen Umlageschlüsseln.',
        items: ['BK-Wizard', 'Umlage-Rechner', 'PDF-Export', 'Mieter-Versand']
    },
    {
        icon: BarChart3,
        title: 'Steuer & AfA',
        description: 'Steueroptimierte Verwaltung mit automatischer Anlage V und AfA-Berechnung.',
        items: ['Anlage V Generator', 'AfA-Rechner', 'Werbungskosten', 'ELSTER-Export']
    },
    {
        icon: Zap,
        title: 'Automatisierung',
        description: 'Sparen Sie Zeit durch intelligente Automatisierung wiederkehrender Aufgaben.',
        items: ['Zahlungserinnerungen', 'Fristenverwaltung', 'Recurring Tasks', 'Workflows']
    },
    {
        icon: Shield,
        title: 'Rechtssicherheit',
        description: 'Bleiben Sie rechtssicher mit aktuellen Mustertexten und Compliance-Checks.',
        items: ['Musterverträge', 'Gesetzestexte', 'Fristen-Reminder', 'Updates']
    },
    {
        icon: Mail,
        title: 'Kommunikation',
        description: 'Professionelle Mieter-Kommunikation mit Vorlagen und Versandprotokoll.',
        items: ['E-Mail-Vorlagen', 'Brief-Versand', 'Mieter-Portal', 'Tickets']
    },
    {
        icon: Calendar,
        title: 'Aufgaben & Termine',
        description: 'Behalten Sie alle Fristen und Aufgaben im Blick mit Erinnerungen.',
        items: ['Aufgaben-Manager', 'Kalender', 'Fristen', 'Benachrichtigungen']
    },
    {
        icon: TrendingUp,
        title: 'Reporting & Analytics',
        description: 'Aussagekräftige Reports und Analysen für fundierte Entscheidungen.',
        items: ['Portfolio-Übersicht', 'Rendite-Analyse', 'Cashflow-Report', 'Export']
    },
    {
        icon: CheckCircle,
        title: 'Mobile App',
        description: 'Greifen Sie von überall auf Ihre Daten zu - Desktop, Tablet und Smartphone.',
        items: ['Responsive Design', 'Offline-Modus', 'Push-Notifications', 'Mobile Scanner']
    }
];

export default function VermitifyFeaturesEnhanced() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Alle Features im Überblick
                    </h1>
                    <p className="text-xl text-gray-600">
                        Vermitify bietet alles, was Sie für professionelle Immobilienverwaltung benötigen
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div key={idx} className="vf-card">
                                <div className="vf-card-body">
                                    <div className="vf-tool-icon w-14 h-14 mb-4">
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 mb-4">{feature.description}</p>
                                    <ul className="space-y-2">
                                        {feature.items.map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-900 to-orange-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">Überzeugt?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Starten Sie jetzt und testen Sie Vermitify 14 Tage kostenlos
                    </p>
                    <Link to={createPageUrl('VermitifySignup')}>
                        <Button className="vf-btn-lg" style={{ background: 'white', color: '#1E3A8A' }}>
                            Kostenlos testen
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}